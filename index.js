const pg = require("pg");
const express = require("express");
const cors = require("cors");
const knex = require("knex");
const knexConfig = require("./knexfile");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// Set up Knex for migrations
const migrationConfig = knexConfig.development;
const knexInstance = knex(migrationConfig);
// development
// const db = new pg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "opulent",
//   password: "Bighead123.",
//   port: 5432,
// });
// live
const db = new pg.Client({
  connectionString:
    "postgres://opulent_user:i5R6Rf2wf9cdD6jcNv9OcObY2neVbb8R@dpg-cp5t7pacn0vc73bl1l90-a.oregon-postgres.render.com/opulent",
  ssl: {
    // SSL options
    rejectUnauthorized: false, // Ignore self-signed certificates (not recommended for production)
    // Other SSL options like ca, cert, key can also be provided if necessary
  },
});
db.connect();

app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.GMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendMail = async (transporter, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log("sent");
  } catch (err) {
    console.log(err);
  }
};

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users");
    res.send(result.rows);
  } catch (err) {
    res.status(400).send(err);
  }
  // db.end();
});

app.post("/signup", async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    password,
    phonenumber,
    country,
    role,
    level,
  } = req.body;
  // const initialBalance = 0000;
  if (firstname && lastname && email && password && phonenumber && country) {
    try {
      const createAccount = await db.query(
        "INSERT INTO users (firstname, lastname, email, password, level, phonenumber, country, role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
        [
          firstname,
          lastname,
          email,
          password,
          level,
          phonenumber,
          country,
          role,
        ],
      );

      const createAccountAmounts = await db.query(
        "INSERT INTO amounts VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [0o000, 0o000, 0o000, 0o000, 0o000, 80, createAccount.rows[0].id],
      );

      sendMail(transporter, {
        from: '"Opulent Team 👻" <opulent201@gmail.com>', // sender address
        to: `${createAccount.rows[0].email}`, // list of receivers
        subject: "Welcome to Opulent Trade", // Subject line
        text: `Hi ${createAccount.rows[0].firstname},
        Welcome to Opulent Trade! We're thrilled to have you as a part of our community. Here, you'll find a world of opportunities, resources, and connections that can help you achieve your financial goals stay tuned!!.
        Best regards,
        Opulent Team`, // plain text body
      });

      res.json({
        status: "success",
        ...createAccount,
        // ...createAccountAmounts,
      });
    } catch (err) {
      if (err.detail === `Key (email)=(${email}) already exists.`) {
        res
          .status(400)
          .json({ status: "failed", message: "User already exist" });
      } else {
        res.status(400).send(err);
      }
    }
  } else {
    res.status(400).send("invalid request");
  }
  // db.end();
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    // console.log(result.rows[0]); //test
    if (result.rows.length > 0) {
      if (result.rows[0].password === password) {
        res.status(200).json({ status: "success", ...result.rows[0] });
      } else {
        console.log(result);
        res
          .status(400)
          .send({ status: "failed", message: "Invalid username or password" });
      }
    } else {
      res
        .status(401)
        .send({ status: "failed", message: "User Does Not Exist" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ooops Something went wrong" });
  }
});

app.post("/getamounts", async (req, res) => {
  const { user_id } = req.body;

  try {
    const result = await db.query("SELECT * FROM amounts WHERE user_id = $1", [
      user_id,
    ]);

    if (result.rows.length > 0) {
      res.status(200).json({ status: "success", ...result.rows[0] });
    } else if (!user_id) {
      res
        .status(401)
        .json({ status: "failed", message: "Invalid request missing userid" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/gettransactions", async (req, res) => {
  const { user_id } = req.body;
  console.log(user_id);

  try {
    const result = await db.query(
      "SELECT * FROM transactions WHERE userid = $1",
      [user_id],
    );

    if (result.rows.length > 0) {
      res.status(200).json({ status: "success", ...result });
    } else if (!user_id) {
      res
        .status(401)
        .json({ status: "failed", message: "Invalid request missing userid" });
    }
  } catch (err) {
    console.dir(err);
    if (err.message.includes('column "user_id" does not exist')) {
      res.status(200).json({ status: "success", message: "No Transactions" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.get("/investment/:userid", async (req, res) => {
  const userid = req.params.userid;
  try {
    const result = await db.query(
      "SELECT * FROM investments WHERE userid = $1",
      [userid],
    );
    if (result.rows.length > 0) {
      res.status(200).json({ status: "success", ...result });
    } else {
      res
        .status(200)
        .json({ status: "success", message: "No recent investments" });
    }
  } catch (error) {
    res.status(400).json({ status: "failed", ...error });
    console.log(error);
  }
});

app.post("/update-userinfo", async (req, res) => {
  const { firstname, lastname, phonenumber, id } = req.body;
  try {
    if (firstname && lastname && phonenumber && id) {
      const update = await db.query(
        "UPDATE users SET firstname = $1, lastname = $2, phonenumber = $3 WHERE id = $4",
        [firstname, lastname, phonenumber, id],
      );
      res
        .status(200)
        .json({ status: "success", message: "settings updated", ...update });
    } else {
      res.status(400).json({ status: "failed", message: "Missing key values" });
    }
  } catch (error) {
    res.status(400).json({ status: "failed", ...error });
    console.log(error);
  }
});

// get user copytrading feature
app.get("/copytrading/:userid", async (req, res) => {
  const userid = req.params.userid;
  console.log(userid);
  try {
    const result = await db.query(
      "SELECT * FROM copytrading WHERE userid = $1",
      [userid],
    );
    console.log(result);
    if (result.rows.length > 0) {
      res.status(200).json({ status: "success", ...result });
    } else {
      res.status(200).json({ status: "success", message: "No details found" });
    }
  } catch (error) {
    res.status(400).json({ status: "failed", ...error });
    console.log(error);
  }
});

// move funds to invested
app.post("/movefunds", async (req, res) => {
  const { userid, invested, email, name, plan } = req.body;
  try {
    let updateAmounts;
    const userInfo = await db.query(
      "SELECT * FROM amounts WHERE user_id = $1",
      [userid],
    );
    if (userInfo.rows.length > 0) {
      const newBalance = userInfo.rows[0].balance - invested;
      const newInvested = +userInfo.rows[0].invested + +invested;
      if (userInfo.rows[0].bonus > 0) {
        updateAmounts = await db.query(
          "UPDATE amounts SET balance=$1,bonus=0,invested=$2+80 WHERE user_id=$3",
          [newBalance, newInvested, userid],
        );
        sendMail(transporter, {
          from: '"Opulent Team 👻" <opulent201@gmail.com>', // sender address
          to: `${email}`, // list of receivers
          subject: "Congratulations on Subscribing to Your First Plan!", // Subject line
          text: `Dear ${name},
          Congratulations on subscribing to your first plan with Opulent Trade! We're thrilled to have you on board and to witness the beginning of your investment journey with us.
          As a token of appreciation for your commitment, we're delighted to inform you that your bonus amount has been added to your invested amount. This additional amount will enhance your investment potential and pave the way for even greater financial success.
          We believe that this bonus will serve as a valuable asset in achieving your investment goals, and we're excited to see your portfolio grow.
          Once again, congratulations on taking this important step toward financial prosperity. We look forward to continuing this journey together.

          Best regards,

          The Opulent Trade Team`, // plain text body
        });
        sendMail(transporter, {
          from: '"Opulent Team 👻" <opulent201@gmail.com>', // sender address
          to: `${email}`, // list of receivers
          subject: `Congratulations on Subscribing to Our ${plan}!`, // Subject line
          text: `Dear ${name},
          We're excited to share the news that you have successfully subscribed to our ${plan} here at Opulent Trade! Your decision to embark on this journey toward financial growth and prosperity is truly commendable, and we're honored to be a part of it.
          With the ${plan}, you're laying the foundation for your investment portfolio, setting the stage for future success. Whether you're new to investing or looking to expand your financial horizons, this plan is designed to provide you with the tools and resources you need to thrive in the world of trading.

          Best regards,

          The Opulent Trade Team`, // plain text body
        });
      } else {
        updateAmounts = await db.query(
          "UPDATE amounts SET balance=$1,invested=$2 WHERE user_id=$3",
          [newBalance, newInvested, userid],
        );
      }
    }

    console.log(updateAmounts);
    res.status(200).json({ status: "success", ...updateAmounts });
  } catch (error) {
    res.status(400).json({ status: "failed", ...error });
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
