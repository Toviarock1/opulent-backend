// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "pg",
    connection: {
      connectionString:
        "postgres://opulent_user:i5R6Rf2wf9cdD6jcNv9OcObY2neVbb8R@dpg-cp5t7pacn0vc73bl1l90-a.oregon-postgres.render.com/opulent",
      ssl: {
        // SSL options
        rejectUnauthorized: false, // Ignore self-signed certificates (not recommended for production)
        // Other SSL options like ca, cert, key can also be provided if necessary
      },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },

  // production: {
  //   client: "postgresql",
  //   connection: {
  //     database: "my_db",
  //     user: "username",
  //     password: "password",
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10,
  //   },
  //   migrations: {
  //     tableName: "knex_migrations",
  //   },
  // },
};
