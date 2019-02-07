import omit from 'lodash/omit'
import oldProtocol from '../../../test/fixtures/preFlexGrandfatheredProtocol.json'
import {
  renameOrderedSteps,
} from '../mig1_2019-2-1.js'

describe('renameOrderedSteps', () => {
  const migratedFile = renameOrderedSteps(oldProtocol)
  test('removes orderedSteps key', () => {
    expect(oldProtocol['designer-application'].data.orderedSteps).not.toEqual(undefined)
    expect(migratedFile['designer-application'].data.orderedSteps).toEqual(undefined)
  })

  test('adds orderedStepIds key and value', () => {
    const oldOrderedStepsIds = oldProtocol['designer-application'].data.orderedStepIds
    expect(oldProtocol['designer-application'].data.orderedStepIds).toEqual(undefined)
    expect(migratedFile['designer-application'].data.orderedStepIds).toEqual(oldOrderedStepsIds)
  })

  test('the rest of file should be unaltered', () => {
    const oldWithout = {
      ...oldProtocol,
      'designer-application': {
        ...oldProtocol['designer-application'],
        data: omit(oldProtocol['designer-application'].data, ['orderedSteps', 'orderedStepIds']),
      },
    }
    const migratedWithout = {
      ...migratedFile,
      'designer-application': {
        ...migratedFile['designer-application'],
        data: omit(migratedFile['designer-application'].data, ['orderedStepIds', 'orderedSteps']),
      },
    }
    expect(oldWithout).toEqual(migratedWithout)
  })
})
