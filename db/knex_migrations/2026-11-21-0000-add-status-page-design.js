exports.up = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.string("design").notNullable().defaultTo("modern");
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.dropColumn("design");
    });
};
