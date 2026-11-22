exports.up = async function (knex) {
    await knex.schema.createTable("incident_update", (table) => {
        table.increments("id");
        table
            .integer("incident_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("incident")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
        table.string("status", 30).notNullable();
        table.text("content").notNullable();
        table.datetime("created_date").notNullable().defaultTo(knex.fn.now());
        table.index(["incident_id", "created_date"], "incident_update_incident_date_index");
    });

    await knex.schema.createTable("incident_monitor", (table) => {
        table.increments("id");
        table
            .integer("incident_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("incident")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
        table
            .integer("monitor_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("monitor")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
        table.unique(["incident_id", "monitor_id"], "incident_monitor_unique");
    });

    const incidents = await knex("incident").select("id", "active", "content", "created_date", "last_updated_date");
    if (incidents.length > 0) {
        await knex("incident_update").insert(
            incidents.map((incident) => ({
                incident_id: incident.id,
                status: incident.active ? "investigating" : "resolved",
                content: incident.content,
                created_date: incident.last_updated_date || incident.created_date,
            }))
        );
    }
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("incident_monitor");
    await knex.schema.dropTableIfExists("incident_update");
};
