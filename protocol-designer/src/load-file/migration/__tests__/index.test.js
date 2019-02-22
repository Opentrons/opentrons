import {getMigrationVersionsToRunFromVersion} from '../index.js'

describe('runs appropriate migrations for version', () => {
  // purposefully out of order
  const stubbedMigrationByVersion = {
    '2.0.0': 'fake migration to 2.0.0',
    '6.3.0': 'fake migration to 6.3.0',
    '1.3.0': 'fake migration to 1.3.0',
    '1.2.0': 'fake migration to 1.2.0',
    '1.1.0': 'fake migration to 1.1.0',
  }
  test('does not run migration if only patch number is larger', () => {
    const migrationsToRun = getMigrationVersionsToRunFromVersion(stubbedMigrationByVersion, '1.1.2')
    expect(migrationsToRun).toEqual(['1.2.0', '1.3.0', '2.0.0', '6.3.0'])
  })
  test('does not run migration if only patch version is identical', () => {
    const migrationsToRun = getMigrationVersionsToRunFromVersion(stubbedMigrationByVersion, '1.1.0')
    expect(migrationsToRun).toEqual(['1.2.0', '1.3.0', '2.0.0', '6.3.0'])
  })
  test('runs all migrations if supplied version is lower than all', () => {
    const migrationsToRun = getMigrationVersionsToRunFromVersion(stubbedMigrationByVersion, '0.0.5')
    expect(migrationsToRun).toEqual(['1.1.0', '1.2.0', '1.3.0', '2.0.0', '6.3.0'])
  })
  test('runs no migrations if supplied version is higher than all', () => {
    const migrationsToRun = getMigrationVersionsToRunFromVersion(stubbedMigrationByVersion, '8.9.5')
    expect(migrationsToRun).toEqual([])
  })
})
