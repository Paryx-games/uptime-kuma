exports.up = function (knex) {
    return knex.schema.alterTable("user", function (table) {
        table.string("avatar", 255).nullable().defaultTo(null);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("user", function (table) {
        table.dropColumn("avatar");
    });
};
