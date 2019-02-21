// @flow
import flow from 'lodash/flow'
import max from 'lodash/max'
import sortBy from 'lodash/sortBy'
import findIndex from 'lodash/findIndex'
import compareVersions from 'compare-versions'
import type {ProtocolFile} from '../../file-types'
import {default as migrate_to_1_1_0} from './1_1_0'

const allMigrations = [
  migrate_to_1_1_0,
]

export const LATEST_MIGRATION_VERSION = max(allMigrations.map(m => m.version))

const masterMigration = (file: any): ProtocolFile => {
  const sortedMigrations = sortBy(allMigrations, m => compareVersions(m.version))

  const designerApplication = file.designerApplication || file['designer-application']

  const {migrationVersion} = designerApplication
  const migrationsToRun = sortedMigrations.slice(findIndex(sortedMigrations, m => m.version === migrationVersion) + 1)

  return flow(migrationsToRun.map(migration => migration.migrateFile))(file)
}

export default masterMigration
