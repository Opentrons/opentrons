import type { Knex } from 'knex'

// This array holds all the database schema changes.
// The app's startup logic will run any new migrations from this list.
export const MIGRATIONS = [
  // NOTE: You may have other migration objects here. Add this one to the end.
  {
    name: '2025_08_01_add_protocol_locks_table',
    up: async (db: Knex): Promise<void> => {
      await db.schema.createTable('protocolLocks', table => {
        table.string('protocolKey').primary()
        table.boolean('isLocked').notNullable().defaultTo(false)
        table.string('passwordHash').nullable()
      })
    },
    down: async (db: Knex): Promise<void> => {
      await db.schema.dropTableIfExists('protocolLocks')
    },
  },
]