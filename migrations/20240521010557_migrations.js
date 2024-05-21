/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("firstname").notNullable();
      table.string("lastname").notNullable();
      table.string("email").notNullable().unique();
      table.string("password").notNullable();
      table.integer("level").notNullable();
      table.string("phonenumber").notNullable();
      table.string("country").notNullable();
      table.string("role").notNullable();
    }),
    knex.schema.createTable("amounts", (table) => {
      table.integer("balance").notNullable();
      table.integer("invested").notNullable();
      table.integer("profit").notNullable();
      table.integer("deposits").notNullable();
      table.integer("withdrawals").notNullable();
      table.integer("bonus").notNullable();
      table.integer("user_id").unsigned().references("id").inTable("users");
    }),
    knex.schema.createTable("transactions", (table) => {
      table.string("description").notNullable();
      table.string("type").notNullable();
      table.integer("amount").notNullable();
      table.date("date").notNullable();
      table.text("time").notNullable();
      table.string("status").notNullable();
      table.integer("userid").unsigned().references("id").inTable("users");
    }),
    knex.schema.createTable("investments", (table) => {
      table.increments("id").primary();
      table.string("capital").notNullable();
      table.string("profit").notNullable();
      table.date("date").notNullable();
      table.text("time").notNullable();
      table.string("status").notNullable();
      table.integer("userid").unsigned().references("id").inTable("users");
      table.string("plan").notNullable();
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTable("users"),
    knex.schema.dropTable("journal"),
  ]);
};
