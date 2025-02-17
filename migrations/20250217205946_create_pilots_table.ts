import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Main pilots table for active/recent data
  await knex.schema.createTable("pilots", (table) => {
    // Reference Columns for Lookups and Data Compare
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("hash").notNullable();

    // Pilot Data
    table.integer("cid").notNullable();
    table.string("name").notNullable();
    table.string("callsign").notNullable();
    table.integer("qnh_mb").notNullable();
    table.integer("heading").notNullable();
    table.integer("altitude").notNullable();
    table.decimal("latitude").notNullable();
    table.decimal("qnh_i_hg").notNullable();
    table.decimal("longitude").notNullable();
    table.integer("groundspeed").notNullable();
    table.string("transponder").notNullable();
    table.integer("military_rating").notNullable();
    table.integer("pilot_rating").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("pilots");
}
