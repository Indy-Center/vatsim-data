import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("vatsim_data", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.jsonb("data");
        table.string("hash");
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("vatsim_data");
}

