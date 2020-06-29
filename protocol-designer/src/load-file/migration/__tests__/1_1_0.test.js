import each from 'lodash/each'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'

import oldProtocol from '../../../../fixtures/protocol/1/doItAll.json'
import {
  addInitialDeckSetupStep,
  INITIAL_DECK_SETUP_STEP_ID,
  MIX_DEPRECATED_FIELD_NAMES,
  renameOrderedSteps,
  replaceTCDStepsWithMoveLiquidStep,
  TCD_DEPRECATED_FIELD_NAMES,
  updateStepFormKeys,
} from '../1_1_0.js'

describe('renameOrderedSteps', () => {
  const migratedFile = renameOrderedSteps(oldProtocol)
  it('removes orderedSteps key', () => {
    expect(oldProtocol['designer-application'].data.orderedSteps).not.toEqual(
      undefined
    )
    expect(migratedFile['designer-application'].data.orderedSteps).toEqual(
      undefined
    )
  })

  it('adds orderedStepIds key and value', () => {
    const oldOrderedStepsIds =
      oldProtocol['designer-application'].data.orderedSteps
    expect(oldProtocol['designer-application'].data.orderedStepIds).toEqual(
      undefined
    )
    expect(migratedFile['designer-application'].data.orderedStepIds).toEqual(
      oldOrderedStepsIds
    )
  })

  it('the rest of file should be unaltered', () => {
    const oldWithout = {
      ...oldProtocol,
      'designer-application': {
        ...oldProtocol['designer-application'],
        data: omit(oldProtocol['designer-application'].data, [
          'orderedSteps',
          'orderedStepIds',
        ]),
      },
    }
    const migratedWithout = {
      ...migratedFile,
      'designer-application': {
        ...migratedFile['designer-application'],
        data: omit(migratedFile['designer-application'].data, [
          'orderedStepIds',
          'orderedSteps',
        ]),
      },
    }
    expect(oldWithout).toEqual(migratedWithout)
  })
})

describe('addInitialDeckSetupStep', () => {
  const migratedFile = addInitialDeckSetupStep(oldProtocol)
  it('adds savedStepForm key', () => {
    expect(
      oldProtocol['designer-application'].data.savedStepForms[
        INITIAL_DECK_SETUP_STEP_ID
      ]
    ).toEqual(undefined)
    expect(
      migratedFile['designer-application'].data.savedStepForms[
        INITIAL_DECK_SETUP_STEP_ID
      ]
    ).not.toEqual(undefined)
  })

  describe('adds well formed savedStepForm value', () => {
    const wellFormedSetupStep = {
      stepType: 'manualIntervention',
      id: INITIAL_DECK_SETUP_STEP_ID,
      labwareLocationUpdate: { trashId: '12' },
      pipetteLocationUpdate: {},
    }
    const deckSetupStepForm =
      migratedFile['designer-application'].data.savedStepForms[
        INITIAL_DECK_SETUP_STEP_ID
      ]
    it('is correct stepType', () => {
      expect(deckSetupStepForm.stepType).toEqual(wellFormedSetupStep.stepType)
    })
    it('has correct id value', () => {
      expect(deckSetupStepForm.id).toEqual(wellFormedSetupStep.id)
    })
    it('constructs labware location update object', () => {
      expect(deckSetupStepForm.labwareLocationUpdate).toEqual({
        ...wellFormedSetupStep.labwareLocationUpdate,
        ...mapValues(oldProtocol.labware, l => l.slot),
      })
    })
    it('constructs pipette location update object', () => {
      expect(deckSetupStepForm.pipetteLocationUpdate).toEqual({
        ...wellFormedSetupStep.pipetteLocationUpdate,
        ...mapValues(oldProtocol.pipettes, p => p.mount),
      })
    })
  })
})

describe('updateStepFormKeys', () => {
  describe('for TCD stepTypes', () => {
    const stubbedTCDStepsFile = {
      'designer-application': {
        data: {
          savedStepForms: {
            '1': {
              id: 1,
              stepType: 'distribute',
              'step-name': 'FakeStepName',
              'step-details': 'fake details',
              aspirate_disposalVol_checkbox: true,
              aspirate_disposalVol_volume: 60,
              aspirate_changeTip: 'always',
              aspirate_preWetTip: true,
              aspirate_touchTip: true,
              aspirate_touchTipMmFromBottom: 20,
              dispense_touchTip: true,
              dispense_touchTipMmFromBottom: 22,
              dispense_blowout_checkbox: true,
              dispense_blowout_labware: 'trashId',
              dispense_blowout_location: 'trashId',
              aspirate_labware:
                'db17bed0-2b08-11e9-9054-4913062421c2:trough-12row',
              aspirate_wells: ['A12'],
              pipette:
                'pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2',
              dispense_labware: 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              dispense_wells: ['A1', 'A2'],
              volume: 30,
              offsetFromBottomMm: 2,
            },
            '2': {
              id: 2,
              stepType: 'transfer',
              'step-name': 'FakeStepName',
              'step-details': 'fake details',
              aspirate_disposalVol_checkbox: true,
              aspirate_disposalVol_volume: 60,
              aspirate_changeTip: 'always',
              aspirate_preWetTip: true,
              aspirate_touchTip: true,
              aspirate_touchTipMmFromBottom: 20,
              dispense_touchTip: true,
              dispense_touchTipMmFromBottom: 22,
              dispense_blowout_checkbox: true,
              dispense_blowout_labware: 'trashId',
              dispense_blowout_location: 'trashId',
              aspirate_labware:
                'db17bed0-2b08-11e9-9054-4913062421c2:trough-12row',
              aspirate_wells: ['A12'],
              pipette:
                'pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2',
              dispense_labware: 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              dispense_wells: ['A1', 'A2'],
              volume: 30,
              offsetFromBottomMm: 2,
            },
            '3': {
              id: 3,
              stepType: 'consolidate',
              'step-name': 'FakeStepName',
              'step-details': 'fake details',
              aspirate_disposalVol_checkbox: true,
              aspirate_disposalVol_volume: 60,
              aspirate_changeTip: 'always',
              aspirate_preWetTip: true,
              aspirate_touchTip: true,
              aspirate_touchTipMmFromBottom: 20,
              dispense_touchTip: true,
              dispense_touchTipMmFromBottom: 22,
              dispense_blowout_checkbox: true,
              dispense_blowout_labware: 'trashId',
              dispense_blowout_location: 'trashId',
              aspirate_labware:
                'db17bed0-2b08-11e9-9054-4913062421c2:trough-12row',
              aspirate_wells: ['A12'],
              pipette:
                'pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2',
              dispense_labware: 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              dispense_wells: ['A1', 'A2'],
              volume: 30,
              offsetFromBottomMm: 2,
            },
          },
        },
      },
    }
    const migratedFile = updateStepFormKeys(stubbedTCDStepsFile)
    it('deprecates all indicated field names', () => {
      each(TCD_DEPRECATED_FIELD_NAMES, fieldName => {
        each(
          stubbedTCDStepsFile['designer-application'].data.savedStepForms,
          stepForm => {
            expect(stepForm[fieldName]).not.toEqual(undefined)
          }
        )
        each(
          migratedFile['designer-application'].data.savedStepForms,
          stepForm => {
            expect(stepForm[fieldName]).toEqual(undefined)
          }
        )
      })
    })
    it('creates non-existent new fields', () => {
      const oldFields =
        stubbedTCDStepsFile['designer-application'].data.savedStepForms['1']
      const addedFields = {
        aspirate_touchTip_checkbox: oldFields['aspirate_touchTip'],
        aspirate_touchTip_mmFromBottom:
          oldFields['aspirate_touchTipMmFromBottom'],
        blowout_checkbox: oldFields['dispense_blowout_checkbox'],
        blowout_location: oldFields['dispense_blowout_location'],
        changeTip: oldFields['aspirate_changeTip'],
        dispense_touchTip_checkbox: oldFields['dispense_touchTip'],
        dispense_touchTip_mmFromBottom:
          oldFields['dispense_touchTipMmFromBottom'],
        disposalVolume_checkbox: oldFields['aspirate_disposalVol_checkbox'],
        disposalVolume_volume: oldFields['aspirate_disposalVol_volume'],
        preWetTip: oldFields['aspirate_preWetTip'],
        stepName: oldFields['step-name'],
        stepDetails: oldFields['step-details'],
      }
      each(Object.keys(addedFields), fieldName => {
        each(
          stubbedTCDStepsFile['designer-application'].data.savedStepForms,
          stepForm => {
            expect(stepForm[fieldName]).toEqual(undefined)
          }
        )
        each(
          migratedFile['designer-application'].data.savedStepForms,
          stepForm =>
            expect(stepForm[fieldName]).toEqual(addedFields[fieldName])
        )
      })
    })
  })

  describe('for mix stepType', () => {
    const stubbedMixStepFile = {
      'designer-application': {
        data: {
          savedStepForms: {
            '1': {
              id: 1,
              stepType: 'mix',
              'step-name': 'Mix',
              'step-details':
                'here is how the mix will happen more specifically\n',
              aspirate_changeTip: 'never',
              labware: 'ccad1a20-2b08-11e9-9054-4913062421c2:96-flat',
              wells: ['A4'],
              pipette:
                'pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2',
              volume: 9,
              times: 2,
              dispense_blowout_checkbox: true,
              dispense_blowout_labware: 'trashId',
              dispense_blowout_location: 'trashId',
              dispense_mmFromBottom: 2,
              aspirate_wellOrder_first: 'l2r',
              aspirate_wellOrder_second: 't2b',
              touchTip: true,
              mix_touchTipMmFromBottom: 24,
            },
          },
        },
      },
    }
    const migratedFile = updateStepFormKeys(stubbedMixStepFile)
    it('deprecates all indicated field names', () => {
      each(MIX_DEPRECATED_FIELD_NAMES, fieldName => {
        each(
          stubbedMixStepFile['designer-application'].data.savedStepForms,
          stepForm => expect(stepForm[fieldName]).not.toEqual(undefined)
        )
        each(
          migratedFile['designer-application'].data.savedStepForms,
          stepForm => expect(stepForm[fieldName]).toEqual(undefined)
        )
      })
    })
    it('creates non-existent new fields', () => {
      const oldFields =
        stubbedMixStepFile['designer-application'].data.savedStepForms['1']
      const addedFields = {
        stepName: oldFields['step-name'],
        stepDetails: oldFields['step-details'],
        changeTip: oldFields['aspirate_changeTip'],
        mix_mmFromBottom: oldFields['dispense_mmFromBottom'],
        mix_wellOrder_first: oldFields['aspirate_wellOrder_first'],
        mix_wellOrder_second: oldFields['aspirate_wellOrder_second'],
        mix_touchTip_checkbox: oldFields['touchTip'],
        mix_touchTip_mmFromBottom: oldFields['mix_touchTipMmFromBottom'],
        blowout_checkbox: oldFields['dispense_blowout_checkbox'],
        blowout_location: oldFields['dispense_blowout_location'],
      }
      each(Object.keys(addedFields), fieldName => {
        each(
          stubbedMixStepFile['designer-application'].data.savedStepForms,
          stepForm => {
            expect(stepForm[fieldName]).toEqual(undefined)
          }
        )
        each(
          migratedFile['designer-application'].data.savedStepForms,
          stepForm => {
            expect(stepForm[fieldName]).toEqual(addedFields[fieldName])
          }
        )
      })
    })
  })
})

describe('replaceTCDStepsWithMoveLiquidStep', () => {
  const oldStepForms = oldProtocol['designer-application'].data.savedStepForms
  const migratedFile = replaceTCDStepsWithMoveLiquidStep(oldProtocol)
  each(oldStepForms, (stepForm, stepId) => {
    if (stepForm.stepType === 'transfer') {
      it('transfer stepType changes into moveLiquid', () => {
        expect(
          migratedFile['designer-application'].data.savedStepForms[stepId]
            .stepType
        ).toEqual('moveLiquid')
      })
      it('transfer stepType always receives single path', () => {
        expect(
          migratedFile['designer-application'].data.savedStepForms[stepId].path
        ).toEqual('single')
      })
    } else if (stepForm.stepType === 'consolidate') {
      it('consolidate stepType changes into moveLiquid', () => {
        expect(
          migratedFile['designer-application'].data.savedStepForms[stepId]
            .stepType
        ).toEqual('moveLiquid')
      })
      it('consolidate stepType always receives multiAspirate path', () => {
        expect(
          migratedFile['designer-application'].data.savedStepForms[stepId].path
        ).toEqual('multiAspirate')
      })
    } else if (stepForm.stepType === 'distribute') {
      it('distribute stepType changes into moveLiquid', () => {
        expect(
          migratedFile['designer-application'].data.savedStepForms[stepId]
            .stepType
        ).toEqual('moveLiquid')
      })
      it('distribute stepType always receives multiAspirate or single path', () => {
        expect(
          migratedFile['designer-application'].data.savedStepForms[stepId].path
        ).toMatch(/multiDispense|single/)
      })
    }
  })
})
