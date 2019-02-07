import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import oldProtocol from '../../__tests__/fixtures/throughMigrationV0/doItAll.json'
import {
  renameOrderedSteps,
  addInitialDeckSetupStep,
  INITIAL_DECK_SETUP_STEP_ID,
  FIXED_TRASH_ID,
} from '../migrationV1.js'

describe('renameOrderedSteps', () => {
  const migratedFile = renameOrderedSteps(oldProtocol)
  test('removes orderedSteps key', () => {
    expect(oldProtocol['designer-application'].data.orderedSteps).not.toEqual(undefined)
    expect(migratedFile['designer-application'].data.orderedSteps).toEqual(undefined)
  })

  test('adds orderedStepIds key and value', () => {
    const oldOrderedStepsIds = oldProtocol['designer-application'].data.orderedSteps
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

describe('addInitialDeckSetupStep', () => {
  const migratedFile = addInitialDeckSetupStep(oldProtocol)
  test('adds savedStepForm key', () => {
    expect(oldProtocol['designer-application'].data.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]).toEqual(undefined)
    expect(migratedFile['designer-application'].data.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]).not.toEqual(undefined)
  })

  describe('adds well formed savedStepForm value', () => {
    const wellFormedSetupStep = {
      stepType: 'manualIntervention',
      id: INITIAL_DECK_SETUP_STEP_ID,
      labwareLocationUpdate: {[FIXED_TRASH_ID]: '12'},
      pipetteLocationUpdate: {},
    }
    const deckSetupStepForm = migratedFile['designer-application'].data.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
    test('is correct stepType', () => {
      expect(deckSetupStepForm.stepType).toEqual(wellFormedSetupStep.stepType)
    })
    test('has correct id value', () => {
      expect(deckSetupStepForm.id).toEqual(wellFormedSetupStep.id)
    })
    test('constructs labware location update object', () => {
      expect(deckSetupStepForm.labwareLocationUpdate).toEqual({
        ...wellFormedSetupStep.labwareLocationUpdate,
        ...mapValues(oldProtocol.labware, (l) => l.slot),
      })
    })
    test('constructs pipette location update object', () => {
      expect(deckSetupStepForm.pipetteLocationUpdate).toEqual({
        ...wellFormedSetupStep.pipetteLocationUpdate,
        ...mapValues(oldProtocol.pipettes, (p) => p.mount),
      })
    })
  })
})
