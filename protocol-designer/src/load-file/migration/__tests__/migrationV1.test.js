import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import each from 'lodash/each'
import oldProtocol from '../../__tests__/fixtures/throughMigrationV0/doItAll.json'
import {
  renameOrderedSteps,
  addInitialDeckSetupStep,
  INITIAL_DECK_SETUP_STEP_ID,
  FIXED_TRASH_ID,
  updateStepFormKeys,
  DEPRECATED_FIELD_NAMES,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
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

describe('updateStepFormKeys', () => {
  describe('for TCD stepTypes', () => {
    const stubbedTCDStepsFile = {
      'designer-application': {
        'data': {
          'savedStepForms': {
            '1': {
              'id': 1,
              'stepType': 'distribute',
              'step-name': 'FakeStepName',
              'step-details': 'fake details',
              'aspirate_disposalVol_checkbox': true,
              'aspirate_disposalVol_volume': 60,
              'aspirate_changeTip': 'always',
              'aspirate_preWetTip': true,
              'aspirate_touchTip': true,
              'dispense_blowout_checkbox': true,
              'dispense_blowout_labware': 'trashId',
              'aspirate_labware': 'db17bed0-2b08-11e9-9054-4913062421c2:trough-12row',
              'aspirate_wells': ['A12'],
              'pipette': 'pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2',
              'dispense_labware': 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              'dispense_wells': ['A1', 'A2'],
              'volume': 30,
              'offsetFromBottomMm': 2,
            },
            '2': {
              'id': 2,
              'stepType': 'transfer',
              'step-name': 'FakeStepName',
              'step-details': 'fake details',
              'aspirate_disposalVol_checkbox': true,
              'aspirate_disposalVol_volume': 60,
              'aspirate_changeTip': 'always',
              'aspirate_preWetTip': true,
              'aspirate_touchTip': true,
              'dispense_blowout_checkbox': true,
              'dispense_blowout_labware': 'trashId',
              'aspirate_labware': 'db17bed0-2b08-11e9-9054-4913062421c2:trough-12row',
              'aspirate_wells': ['A12'],
              'pipette': 'pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2',
              'dispense_labware': 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              'dispense_wells': ['A1', 'A2'],
              'volume': 30,
              'offsetFromBottomMm': 2,
            },
            '3': {
              'id': 3,
              'stepType': 'consolidate',
              'step-name': 'FakeStepName',
              'step-details': 'fake details',
              'aspirate_disposalVol_checkbox': true,
              'aspirate_disposalVol_volume': 60,
              'aspirate_changeTip': 'always',
              'aspirate_preWetTip': true,
              'aspirate_touchTip': true,
              'dispense_blowout_checkbox': true,
              'dispense_blowout_labware': 'trashId',
              'aspirate_labware': 'db17bed0-2b08-11e9-9054-4913062421c2:trough-12row',
              'aspirate_wells': ['A12'],
              'pipette': 'pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2',
              'dispense_labware': 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              'dispense_wells': ['A1', 'A2'],
              'volume': 30,
              'offsetFromBottomMm': 2,
            },
          },
        },
      },
    }
    const migratedFile = updateStepFormKeys(stubbedTCDStepsFile)
    test('deprecates all indicated field names', () => {
      each(DEPRECATED_FIELD_NAMES, fieldName => {
        each(stubbedTCDStepsFile['designer-application'].data.savedStepForms, stepForm => {
          expect(stepForm[fieldName]).not.toEqual(undefined)
        })
        each(migratedFile['designer-application'].data.savedStepForms, stepForm => {
          expect(stepForm[fieldName]).toEqual(undefined)
        })
      })
    })
    test('creates non-existent new fields', () => {
      const oldFields = stubbedTCDStepsFile['designer-application'].data.savedStepForms['1']
      const addedFields = {
        aspirate_touchTip_checkbox: oldFields['aspirate_touchTip'],
        blowout_checkbox: oldFields['dispense_blowout_checkbox'],
        blowout_location: oldFields['dispense_blowout_location'] || oldFields['dispense_blowout_labware'],
        changeTip: oldFields['aspirate_changeTip'],
        dispense_touchTip_checkbox: oldFields['dispense_touchTip'],
        disposalVolume_checkbox: oldFields['aspirate_disposalVol_checkbox'],
        disposalVolume_volume: oldFields['aspirate_disposalVol_volume'],
        preWetTip: oldFields['aspirate_preWetTip'],
        stepName: oldFields['step-name'],
        stepDetails: oldFields['step-details'],
        aspirate_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        dispense_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_wells_grouped: false,
      }
      each(Object.keys(addedFields), fieldName => {
        each(stubbedTCDStepsFile['designer-application'].data.savedStepForms, stepForm => {
          expect(stepForm[fieldName]).toEqual(undefined)
        })
        each(migratedFile['designer-application'].data.savedStepForms, stepForm => {
          expect(stepForm[fieldName]).toEqual(addedFields[fieldName])
        })
      })
    })
  })

  describe('for mix stepType', () => {
    const stubbedMixStepFile = {
      'designer-application': {
        'data': {
          'savedStepForms': {
            '1': {
              'id': 1,
              'stepType': 'mix',
              'step-name': 'Mix',
              'step-details': 'here is how the mix will happen more specifically\n',
              'aspirate_changeTip': 'never',
              'labware': 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              'wells': ['A4'],
              'pipette': 'pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2',
              'volume': 9,
              'times': 2,
              'dispense_blowout_checkbox': true,
              'dispense_blowout_labware': 'trashId',
              'touchTip': true,
            },
          },
        },
      },
    }
    const migratedFile = updateStepFormKeys(stubbedMixStepFile)
    test('deprecates all indicated field names', () => {
      each(DEPRECATED_FIELD_NAMES, fieldName => {
        each(stubbedMixStepFile['designer-application'].data.savedStepForms, stepForm => (
          expect(stepForm[fieldName]).not.toEqual(undefined)
        ))
        each(migratedFile['designer-application'].data.savedStepForms, stepForm => (
          expect(stepForm[fieldName]).toEqual(undefined)
        ))
      })
    })
  })
})
