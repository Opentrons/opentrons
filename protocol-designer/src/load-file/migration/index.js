// @flow
import flow from 'lodash/flow'
import max from 'lodash/max'
import type {ProtocolFile} from '../../file-types'
import {default as migrationV1} from './migrationV1'

const allMigrations = [
  migrationV1,
]

export const MOST_RECENT_MIGRATION_VERSION = max(allMigrations.map(m => m.version))

const masterMigration = (file: any): ProtocolFile => (
  flow(allMigrations.map(migration => migration.migrateFile))(file)
)

export default masterMigration
