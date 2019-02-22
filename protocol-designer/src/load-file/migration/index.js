// @flow
import flow from 'lodash/flow'
import takeRightWhile from 'lodash/takeRightWhile'
import semver from 'semver'
import type {ProtocolFile} from '../../file-types'
import migrateTo_1_1_0 from './1_1_0'

const OLDEST_MIGRATEABLE_VERSION = '1.0.0'

type Version = string
type Migration = (ProtocolFile) => ProtocolFile
type MigrationsByVersion = {[Version]: Migration}

const allMigrationsByVersion: MigrationsByVersion = {
  '1.1.0': migrateTo_1_1_0,
}

// get all versions to migrate newer than the file's applicationVersion
export const getMigrationVersionsToRunFromVersion = (migrationsByVersion: {}, version: Version): Array<Version> => {
  const allSortedVersions = Object.keys(migrationsByVersion).sort(semver.compare)
  return takeRightWhile(allSortedVersions, v => semver.gt(v, version))
}

const masterMigration = (file: any): ProtocolFile => {
  const designerApplication = file.designerApplication || file['designer-application']

  // NOTE: default exists because any protocol that doesn't include the applicationVersion
  // key will be treated as the oldest migrateable version ('1.0.0')
  const {applicationVersion = OLDEST_MIGRATEABLE_VERSION} = designerApplication

  const migrationVersionsToRun = getMigrationVersionsToRunFromVersion(allMigrationsByVersion, applicationVersion)
  return flow(migrationVersionsToRun.map(version => allMigrationsByVersion[version]))(file)
}

export default masterMigration
