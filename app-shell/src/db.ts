import path from 'path'
import { app } from 'electron'
import Knex from 'knex'
import type { Knex as KnexType } from 'knex'

const DB_FILE_NAME = 'opentrons.db'
const DB_PATH = path.join(app.getPath('userData'), DB_FILE_NAME)

// Define a type for a single migration object
interface Migration {
  name: string
  up: (db: KnexType) => Promise<void>
  down: (db: KnexType) => Promise<void>
}

const MIGRATIONS: Migration[] = [
  {
    name: '2025_08_01_add_protocol_locks_table',
    up: async (db: KnexType): Promise<void> => {
      await db.schema.createTable('protocolLocks', table => {
        table.string('protocolKey').primary()
        table.boolean('isLocked').notNullable().defaultTo(false)
        table.string('passwordHash').nullable()
      })
    },
    down: async (db: KnexType): Promise<void> => {
      await db.schema.dropTableIfExists('protocolLocks')
    },
  },
]

class CustomMigrationSource {
  getMigrations(): Promise<Migration[]> {
    return Promise.resolve(MIGRATIONS)
  }

  getMigrationName(migration: Migration): string {
    return migration.name
  }

  // This method now correctly returns a Promise
  getMigration(migration: Migration): Promise<Migration> {
    return Promise.resolve(migration)
  }
}

const knexConfig: KnexType.Config = {
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
  migrations: {
    migrationSource: new CustomMigrationSource(),
  },
}

const db = Knex(knexConfig)

export function getDb(): KnexType {
  return db
}

export function initDb(): Promise<unknown> {
  return db.migrate.latest()
}