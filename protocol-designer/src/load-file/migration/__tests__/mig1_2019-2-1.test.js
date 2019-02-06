import oldProtocol from './throughMigration0.json'
import migrateToVersion1 from '../mig1_2019-2-1.js'

describe('renameOrderedSteps', () => {
  const migratedFile = migrateToVersion1(oldProtocol)
  test('removes orderedSteps key', () => {
    expect(migratedFile).toEqual(containersInitialState)
  })

  test('adds orderedStepIds key and value', () => {
  })

  test('the rest of file should be unaltered', () => {
  })
})