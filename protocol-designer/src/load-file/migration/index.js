// @flow
import flow from 'lodash/flow'
import max from 'lodash/max'
import sortBy from 'lodash/sortBy'
import findIndex from 'lodash/findIndex'
import type {ProtocolFile} from '../../file-types'
import {default as migrationV1} from './migrationV1'

const allMigrations = [
  migrationV1,
]

export const LATEST_MIGRATION_VERSION = max(allMigrations.map(m => m.version))

const masterMigration = (file: any): ProtocolFile => {
  const sortedMigrations = sortBy(allMigrations, m => m.version)

  const designerApplication = file.designerApplication || file['designer-application']

  const {migrationVersion} = designerApplication
  const migrationsToRun = sortedMigrations.slice(findIndex(sortedMigrations, m => m.version === migrationVersion) + 1)

  return flow(migrationsToRun.map(migration => migration.migrateFile))(file)
}

export default masterMigration
