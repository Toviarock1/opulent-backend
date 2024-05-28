const pg = require("pg");
const express = require("express");
const cors = require("cors");
const knex = require("knex");
const knexConfig = require("./knexfile");

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
  const { firstname, lastname, email, password, phonenumber, country, role } =
    req.body;
  // const initialBalance = 0000;
  if (firstname && lastname && email && password && phonenumber && country) {
    try {
      const createAccount = await db.query(
        "INSERT INTO users (firstname, lastname, email, password, level, phonenumber, country, role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
        [firstname, lastname, email, password, 1, phonenumber, country, role]
      );

      const createAccountAmounts = await db.query(
        "INSERT INTO amounts VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [0o000, 0o000, 0o000, 0o000, 0o000, 80, createAccount.rows[0].id]
      );

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
    // console.log(result.rows[0]);
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
      [user_id]
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
      [userid]
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
        [firstname, lastname, phonenumber, id]
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
      [userid]
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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
