const path = require('path')
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./orders.sqlite3"
  },
  useNullAsDefault: true,
});


class AppMigration {

  getMigrations() {
    return Promise.resolve(['orderTable'])
  }

  getMigrationName(migration) {
    return migration;
  }

  getMigration(migration) {
    switch(migration) {
      case 'orderTable':
        return {
          up: (knex) => { 
            return knex.schema.createTable('orders', function (table) {
              table.increments('ID');
              table.string('CheckID');
              table.string('CheckNum');
              table.date('CheckOpenTime');
              table.string('CheckSeq');
              table.string('KdsStatus');
              table.string('KdsStatusTime');
              table.boolean('ShowItem').defaultTo(true)
            })
          },
          down: (knex) => { return knex.schema.dropTable("orders") },
        }
    }
  }
}

exports.knex = knex
exports.AppMigration = AppMigration