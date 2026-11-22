exports.up = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.boolean("is_test_monitor").notNullable().defaultTo(false);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("is_test_monitor");
    });
};
