// @flow
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data'
import {
  orderedStepIds,
  labwareInvariantProperties,
  moduleInvariantProperties,
  presavedStepForm,
  savedStepForms,
  unsavedForm,
} from '../reducers'
import {
  _getPipetteEntitiesRootState,
  _getLabwareEntitiesRootState,
  _getInitialDeckSetupRootState,
} from '../selectors'
import { handleFormChange } from '../../steplist/formLevel/handleFormChange'
import { moveDeckItem } from '../../labware-ingred/actions'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  SPAN7_8_10_11_SLOT,
  PAUSE_UNTIL_TEMP,
} from '../../constants'
import { PRESAVED_STEP_ID } from '../../steplist/types'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import type { DeckSlot } from '../../types'
jest.mock('../../labware-defs/utils')
jest.mock('../selectors')
jest.mock('../../steplist/formLevel/handleFormChange')
jest.mock('../../utils/labwareModuleCompatibility')

const handleFormChangeMock: JestMockFn<
  [{ [string]: any }, { [string]: any }, any, any],
  { [string]: any }
> = handleFormChange

const getLabwareIsCompatibleMock: JestMockFn<
  [any],
  boolean
> = getLabwareIsCompatible

const mock_getPipetteEntitiesRootState: JestMockFn<
  [any],
  any
> = _getPipetteEntitiesRootState
const mock_getLabwareEntitiesRootState: JestMockFn<
  [any],
  any
> = _getLabwareEntitiesRootState
const mock_getInitialDeckSetupRootState: JestMockFn<
  [any],
  any
> = _getInitialDeckSetupRootState

beforeEach(() => {
  jest.clearAllMocks()
})

describe('orderedStepIds reducer', () => {
  it('should add a saved step when that step is new', () => {
    const state = ['99']
    const action = {
      type: 'SAVE_STEP_FORM',
      payload: { id: '123', stepType: 'moveLiquid' },
    }
    expect(orderedStepIds(state, action)).toEqual(['99', '123'])
  })

  it('should not update when an existing step is saved', () => {
    const state = ['99', '123', '11']
    const action = {
      type: 'SAVE_STEP_FORM',
      payload: { id: '123', stepType: 'moveLiquid' },
    }
    expect(orderedStepIds(state, action)).toBe(state)
  })

  describe('reorder steps', () => {
    const state = ['1', '2', '3', '4']
    const testCases = [
      {
        label: '+1 to first',
        payload: {
          delta: 1,
          stepId: '1',
        },
        expected: ['2', '1', '3', '4'],
      },
      {
        label: '+0 to first: no change',
        payload: {
          delta: 0,
          stepId: '1',
        },
        expected: state,
      },
      {
        label: '-1 to first: no change',
        payload: {
          delta: -1,
          stepId: '1',
        },
        expected: state,
      },
      {
        label: '-10 to first: no change',
        payload: {
          delta: -10,
          stepId: '1',
        },
        expected: state,
      },

      {
        label: '-1 to second',
        payload: {
          delta: -1,
          stepId: '2',
        },
        expected: ['2', '1', '3', '4'],
      },
      {
        label: '-10 to second',
        payload: {
          delta: -10,
          stepId: '2',
        },
        expected: ['2', '1', '3', '4'],
      },

      {
        label: '+1 to last: no change',
        payload: {
          delta: 1,
          stepId: '4',
        },
        expected: state,
      },
      {
        label: '+10 to last: no change',
        payload: {
          delta: 10,
          stepId: '4',
        },
        expected: state,
      },
    ]

    testCases.forEach(({ label, payload, expected }) => {
      it(label, () => {
        const action = {
          type: 'REORDER_SELECTED_STEP',
          payload,
        }
        expect(orderedStepIds(state, action)).toEqual(expected)
      })
    })
  })
})

describe('labwareInvariantProperties reducer', () => {
  it('replace custom labware def', () => {
    const prevState = {
      labwareIdA1: { labwareDefURI: 'foo/a/1' },
      labwareIdA2: { labwareDefURI: 'foo/a/1' },
      labwareIdB: { labwareDefURI: 'foo/b/1' },
    }
    const result = labwareInvariantProperties(prevState, {
      type: 'REPLACE_CUSTOM_LABWARE_DEF',
      payload: {
        defURIToOverwrite: 'foo/a/1',
        newDef: { parameters: { loadName: 'a' }, version: 2, namespace: 'foo' },
        isOverwriteMismatched: false,
      },
    })
    expect(result).toEqual({
      // changed
      labwareIdA1: { labwareDefURI: 'foo/a/2' },
      labwareIdA2: { labwareDefURI: 'foo/a/2' },
      // unchanged
      labwareIdB: { labwareDefURI: 'foo/b/1' },
    })
  })
})

describe('moduleInvariantProperties reducer', () => {
  let prevState
  const existingModuleId = 'existingModuleId'
  const newId = 'newModuleId'
  beforeEach(() => {
    prevState = {
      [existingModuleId]: {
        id: existingModuleId,
        slot: '1',
        type: MAGNETIC_MODULE_TYPE,
        model: 'someMagModel',
      },
    }
  })

  it('create module', () => {
    const newModuleData = {
      id: newId,
      slot: '3',
      type: TEMPERATURE_MODULE_TYPE,
      model: 'someTempModel',
    }
    const result = moduleInvariantProperties(prevState, {
      type: 'CREATE_MODULE',
      payload: newModuleData,
    })
    expect(result).toEqual({
      ...prevState,
      [newId]: {
        id: newId,
        type: newModuleData.type,
        model: newModuleData.model,
      },
    })
  })

  it('edit module (change its model)', () => {
    const newModel = 'someDifferentModel'
    const result = moduleInvariantProperties(prevState, {
      type: 'EDIT_MODULE',
      payload: { id: existingModuleId, model: newModel },
    })
    expect(result).toEqual({
      [existingModuleId]: { ...prevState.existingModuleId, model: newModel },
    })
  })

  it('delete module', () => {
    const result = moduleInvariantProperties(prevState, {
      type: 'DELETE_MODULE',
      payload: { id: existingModuleId },
    })
    expect(result).toEqual({})
  })
})

type MakeDeckSetupStepArgs = {
  labwareLocationUpdate?: { [id: string]: DeckSlot },
  pipetteLocationUpdate?: { [id: string]: DeckSlot },
  moduleLocationUpdate?: { [id: string]: DeckSlot },
}

const makeDeckSetupStep = (args: MakeDeckSetupStepArgs = {}) => ({
  stepType: 'manualIntervention',
  id: '__INITIAL_DECK_SETUP_STEP__',
  labwareLocationUpdate: args.labwareLocationUpdate || {},
  pipetteLocationUpdate: args.pipetteLocationUpdate || {},
  moduleLocationUpdate: args.moduleLocationUpdate || {},
})

const makePrevRootState = (args: MakeDeckSetupStepArgs): any => ({
  savedStepForms: {
    [INITIAL_DECK_SETUP_STEP_ID]: makeDeckSetupStep(args),
  },
})

describe('savedStepForms reducer: initial deck setup step', () => {
  const existingLabwareId = '_existingLabwareId'
  const otherLabwareId = '_otherLabwareId'
  const newLabwareId = '_newLabwareId'
  const moduleId = '_moduleId'
  const otherModuleId = '_otherModuleId'
  const labwareOnModuleId = '_labwareOnModuleId'

  describe('create (or duplicate) new labware', () => {
    const newSlot = '8'
    const testCases = [
      {
        testName: 'duplicate labware',
        action: {
          type: 'DUPLICATE_LABWARE',
          payload: {
            templateLabwareId: existingLabwareId,
            duplicateLabwareId: newLabwareId,
            duplicateLabwareNickname: 'new labware nickname',
            slot: newSlot,
          },
        },
      },
      {
        testName: `create labware in slot ${newSlot}`,
        action: {
          type: 'CREATE_CONTAINER',
          payload: {
            slot: newSlot,
            labwareDefURI: 'fixtures/foo/1',
            id: newLabwareId,
          },
        },
      },
    ]

    testCases.forEach(({ testName, action }) => {
      it(testName, () => {
        const prevRootState = makePrevRootState({
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
          },
        })
        const result = savedStepForms(prevRootState, action)
        expect(
          result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
        ).toEqual({
          [existingLabwareId]: '1',
          [newLabwareId]: newSlot,
        })
      })
    })
  })

  describe('move deck item', () => {
    const testCases: Array<{|
      testName: string,
      sourceSlot: DeckSlot,
      destSlot: DeckSlot,
      makeStateArgs: MakeDeckSetupStepArgs,
      expectedLabwareLocations?: Object,
      expectedModuleLocations?: Object,
    |}> = [
      {
        testName: 'move labware to empty slot -> simple move',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: '3',
        },
      },
      {
        testName: 'move labware to slot with labware -> swap labware',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
            [otherLabwareId]: '3',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: '3',
          [otherLabwareId]: '1',
        },
      },
      {
        testName: 'move labware empty module -> labware added to module',
        sourceSlot: '1',
        destSlot: moduleId,
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
          },
          moduleLocationUpdate: {
            [moduleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        // NOTE: if labware is incompatible, it's up to the UI to block this.
        testName:
          'move labware to slot with occupied module -> swap labware, module stays',
        sourceSlot: '1',
        destSlot: moduleId,
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '1',
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: moduleId,
          [labwareOnModuleId]: '1',
        },
        expectedModuleLocations: {
          [moduleId]: '3',
        },
      },
      {
        testName: 'move empty module to empty slot -> simple move',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {},
          moduleLocationUpdate: {
            [moduleId]: '1',
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: { [moduleId]: '3' },
      },
      {
        testName:
          'move empty module to slot with incompatible labware -> swap slots, do not add labware to module',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: { [existingLabwareId]: '3' },
          moduleLocationUpdate: { [moduleId]: '1' },
        },
        deckSetup: {
          labware: {
            [existingLabwareId]: {
              id: existingLabwareId,
              slot: '3',
              def: { foo: 'fake def' },
            },
          },
          pipettes: {},
          modules: {
            [moduleId]: {
              id: moduleId,
              type: MAGNETIC_MODULE_TYPE,
              model: MAGNETIC_MODULE_V2,
              slot: '1',
            },
          },
        },
        labwareIsCompatible: false,
        expectedLabwareLocations: { [existingLabwareId]: '1' },
        expectedModuleLocations: { [moduleId]: '3' },
      },
      {
        testName:
          'move empty module to slot with compatible labware -> put module under labware',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: { [existingLabwareId]: '3' },
          moduleLocationUpdate: { [moduleId]: '1' },
        },
        deckSetup: {
          labware: {
            [existingLabwareId]: {
              id: existingLabwareId,
              slot: '3',
              def: { foo: 'fake def' },
            },
          },
          pipettes: {},
          modules: {
            [moduleId]: {
              id: moduleId,
              type: MAGNETIC_MODULE_TYPE,
              model: MAGNETIC_MODULE_V2,
              slot: '1',
            },
          },
        },
        labwareIsCompatible: true,
        expectedLabwareLocations: { [existingLabwareId]: moduleId },
        expectedModuleLocations: { [moduleId]: '3' },
      },
      {
        testName:
          'move occupied module to slot with labware -> swap slots, do not change labware on module (even if compatible)',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: '3',
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: { [moduleId]: '1' },
        },
        deckSetup: {
          labware: {
            [existingLabwareId]: {
              id: existingLabwareId,
              slot: '3',
              def: { foo: 'fake def' },
            },
            [labwareOnModuleId]: {
              id: labwareOnModuleId,
              slot: moduleId,
              def: { foo: 'fake def' },
            },
          },
          pipettes: {},
          modules: {
            [moduleId]: {
              id: moduleId,
              type: MAGNETIC_MODULE_TYPE,
              model: MAGNETIC_MODULE_V2,
              slot: '1',
            },
          },
        },
        labwareIsCompatible: true,
        expectedLabwareLocations: {
          [existingLabwareId]: '1',
          [labwareOnModuleId]: moduleId,
        },
        expectedModuleLocations: { [moduleId]: '3' },
      },
      {
        testName: 'move labware off of module to empty slot',
        sourceSlot: moduleId,
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: { [moduleId]: '1' },
        },
        expectedLabwareLocations: { [labwareOnModuleId]: '3' },
        expectedModuleLocations: { [moduleId]: '1' },
      },
      {
        testName: 'move empty module to occupied module -> swap, keep pairings',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
      {
        testName: 'empty module to empty module -> swap',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {},
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
      {
        testName: 'occupied module to occupied module -> swap, keep pairings',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
            [otherLabwareId]: otherModuleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: moduleId,
          [otherLabwareId]: otherModuleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
      {
        testName: 'occupied module to empty module -> swap, keep pairings',
        sourceSlot: '1',
        destSlot: '3',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: moduleId,
          },
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '3',
          },
        },
        expectedLabwareLocations: {
          [labwareOnModuleId]: moduleId,
        },
        expectedModuleLocations: {
          [moduleId]: '3',
          [otherModuleId]: '1',
        },
      },
    ]
    testCases.forEach(
      ({
        testName,
        sourceSlot,
        destSlot,
        makeStateArgs,
        deckSetup,
        labwareIsCompatible,
        expectedLabwareLocations,
        expectedModuleLocations,
      }) => {
        it(testName, () => {
          mock_getInitialDeckSetupRootState.mockReturnValue(deckSetup)
          getLabwareIsCompatibleMock.mockReturnValue(labwareIsCompatible)
          const prevRootState = makePrevRootState(makeStateArgs)
          const action = moveDeckItem(sourceSlot, destSlot)
          const result = savedStepForms(prevRootState, action)

          if (expectedLabwareLocations) {
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
            ).toEqual(expectedLabwareLocations)
          }
          if (expectedModuleLocations) {
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate
            ).toEqual(expectedModuleLocations)
          }
        })
      }
    )
  })

  it('delete labware -> removes labware from initial deck setup step', () => {
    const labwareToDeleteId = '__labwareToDelete'
    const prevRootState = makePrevRootState({
      labwareLocationUpdate: {
        [existingLabwareId]: '1',
        [labwareToDeleteId]: '2',
      },
    })
    const action = {
      type: 'DELETE_CONTAINER',
      payload: { labwareId: labwareToDeleteId },
    }
    const result = savedStepForms(prevRootState, action)
    expect(result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate).toEqual({
      [existingLabwareId]: '1',
    })
  })

  it('delete pipettes -> removes pipette(s) from initial deck setup step', () => {
    const leftPipetteId = '__leftPipette'
    const rightPipetteId = '__rightPipette'
    const prevRootState = makePrevRootState({
      pipetteLocationUpdate: {
        [leftPipetteId]: 'left',
        [rightPipetteId]: 'right',
      },
    })
    const testCases = [
      {
        pipettesToDelete: [leftPipetteId],
        expected: { [rightPipetteId]: 'right' },
      },
      { pipettesToDelete: [leftPipetteId, rightPipetteId], expected: {} },
    ]
    testCases.forEach(({ pipettesToDelete, expected }) => {
      const action = {
        type: 'DELETE_PIPETTES',
        payload: pipettesToDelete,
      }
      const result = savedStepForms(prevRootState, action)
      expect(result[INITIAL_DECK_SETUP_STEP_ID].pipetteLocationUpdate).toEqual(
        expected
      )
    })
  })

  describe('create module', () => {
    describe('NO existing steps', () => {
      const destSlot = '3'
      const testCases = [
        {
          testName:
            'create module in empty deck slot (labware in unrelated slot unaffected)',
          makeStateArgs: {
            labwareLocationUpdate: { [existingLabwareId]: '6' },
          },
          expectedLabwareLocations: { [existingLabwareId]: '6' },
          expectedModuleLocations: { [moduleId]: destSlot },
        },
        {
          testName:
            'create module in deck slot occupied with labware -> move that labware to the new module',
          makeStateArgs: {
            labwareLocationUpdate: { [existingLabwareId]: destSlot },
          },
          expectedLabwareLocations: { [existingLabwareId]: moduleId },
          expectedModuleLocations: { [moduleId]: destSlot },
        },
      ]
      testCases.forEach(
        ({
          testName,
          makeStateArgs,
          expectedLabwareLocations,
          expectedModuleLocations,
        }) => {
          it(testName, () => {
            const action = {
              type: 'CREATE_MODULE',
              payload: {
                id: moduleId,
                slot: destSlot,
                type: TEMPERATURE_MODULE_TYPE,
                model: 'someTempModel',
              },
            }
            const prevRootState = makePrevRootState(makeStateArgs)
            const result = savedStepForms(prevRootState, action)
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
            ).toEqual(expectedLabwareLocations)
            expect(
              result[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate
            ).toEqual(expectedModuleLocations)
          })
        }
      )
    })
    describe('existing steps', () => {
      let prevRootStateWithMagStep
      beforeEach(() => {
        prevRootStateWithMagStep = {
          savedStepForms: {
            ...makePrevRootState().savedStepForms,
            ...{
              mag_step_form_id: {
                stepType: 'magnet',
                moduleId: 'magdeckId',
              },
            },
          },
        }
      })
      let testCases = [
        {
          testName: 'create mag mod -> override mag step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'newMagdeckId',
              slot: '1',
              type: MAGNETIC_MODULE_TYPE,
              model: 'someMagModel',
            },
          },
          expectedModuleId: 'newMagdeckId',
        },
        {
          testName: 'create temp mod -> DO NOT override mag step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'tempdeckId',
              slot: '1',
              type: TEMPERATURE_MODULE_TYPE,
              model: 'someTempModel',
            },
          },
          expectedModuleId: 'magdeckId',
        },
        {
          testName: 'create TC -> DO NOT override mag step module id',
          action: {
            type: 'CREATE_MODULE',
            payload: {
              id: 'ThermocyclerId',
              slot: '1',
              type: THERMOCYCLER_MODULE_TYPE,
              model: 'someThermoModel',
            },
          },
          expectedModuleId: 'magdeckId',
        },
      ]

      testCases.forEach(({ testName, action, expectedModuleId }) => {
        it(testName, () => {
          const result = savedStepForms(prevRootStateWithMagStep, action)
          expect(result.mag_step_form_id.moduleId).toBe(expectedModuleId)
        })
      })
    })
  })

  describe('delete module -> removes module from initial deck setup step', () => {
    const testCases = [
      {
        testName: 'delete unoccupied module',
        makeStateArgs: {
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '2',
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: {
          [otherModuleId]: '2',
        },
      },
      {
        testName: 'delete occupied module -> labware goes into its slot',
        makeStateArgs: {
          labwareLocationUpdate: { [labwareOnModuleId]: moduleId },
          moduleLocationUpdate: {
            [moduleId]: '3',
          },
        },
        expectedLabwareLocations: { [labwareOnModuleId]: '3' },
        expectedModuleLocations: {},
      },
      {
        testName:
          'delete occupied module in span7_8_10_11 slot -> labware goes into slot 7',
        makeStateArgs: {
          labwareLocationUpdate: { [labwareOnModuleId]: moduleId },
          moduleLocationUpdate: {
            [moduleId]: SPAN7_8_10_11_SLOT,
          },
        },
        expectedLabwareLocations: { [labwareOnModuleId]: '7' },
        expectedModuleLocations: {},
      },
    ]
    testCases.forEach(
      ({
        testName,
        makeStateArgs,
        expectedLabwareLocations,
        expectedModuleLocations,
      }) => {
        it(testName, () => {
          const action = { type: 'DELETE_MODULE', payload: { id: moduleId } }
          const prevRootState = makePrevRootState(makeStateArgs)
          const result = savedStepForms(prevRootState, action)
          expect(
            result[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate
          ).toEqual(expectedModuleLocations)
          expect(
            result[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
          ).toEqual(expectedLabwareLocations)
        })
      }
    )
  })

  describe('delete module -> removes references to module from step forms', () => {
    const stepId = '_stepId'
    const action = { type: 'DELETE_MODULE', payload: { id: moduleId } }
    const getPrevRootStateWithStep = step => ({
      savedStepForms: {
        [INITIAL_DECK_SETUP_STEP_ID]: makeDeckSetupStep({
          moduleLocationUpdate: {
            [moduleId]: '1',
            [otherModuleId]: '2',
          },
        }),
        [stepId]: step,
      },
    })

    const testCases = [
      {
        testName: 'pause -> wait until temperature step',
        step: {
          id: stepId,
          stepType: 'pause',
          stepName: 'pause until 4C',
          stepDetails: 'some details',
          pauseAction: PAUSE_UNTIL_TEMP,
          pauseHour: null,
          pauseMinute: null,
          pauseSecond: null,
          pauseMessage: '',
          moduleId,
          pauseTemperature: '4',
        },
      },
      {
        testName: 'set temperature step',
        step: {
          id: stepId,
          stepType: 'temperature',
          stepName: 'temperature to 4',
          stepDetails: 'some details',
          moduleId,
          setTemperature: 'true',
          targetTemperature: '4',
        },
      },
      {
        testName: 'magnet step',
        step: {
          id: stepId,
          stepType: 'magnet',
          stepName: 'engage magnet',
          stepDetails: 'some details',
          moduleId,
          magnetAction: 'engage',
          engageHeight: '4',
        },
      },
    ]

    testCases.forEach(({ testName, step }) => {
      it(testName, () => {
        const result = savedStepForms(getPrevRootStateWithStep(step), action)
        expect(result[stepId]).toEqual({ ...step, moduleId: null })
      })
    })
  })

  describe('EDIT_MODULE', () => {
    it('should set engageHeight to null for all Magnet > Engage steps when a magnet module has its model changed, unless height matches default', () => {
      mock_getInitialDeckSetupRootState.mockReturnValue({
        labware: {
          magPlateId: {
            id: 'magPlateId',
            slot: 'magModuleId',
            def: { parameters: { magneticModuleEngageHeight: 12 } },
          },
        },
        pipettes: {},
        modules: {
          magModuleId: {
            id: 'magModuleId',
            type: MAGNETIC_MODULE_TYPE,
            model: MAGNETIC_MODULE_V1,
            slot: '1',
          },
        },
      })

      const action = {
        type: 'EDIT_MODULE',
        payload: { id: 'magModuleId', model: 'magneticModuleV2' },
      }

      const prevRootState = {
        savedStepForms: {
          magnetEngageStepId: {
            stepType: 'magnet',
            magnetAction: 'engage',
            moduleId: 'magModuleId',
            engageHeight: '24', // = 12 * 2 b/c we're going V1 -> V2
          },
          magnetDisengageStepId: {
            stepType: 'magnet',
            magnetAction: 'disengage',
            engageHeight: null,
            moduleId: 'magModuleId',
          },
          nonDefaultMagnetEngageStepId: {
            stepType: 'magnet',
            magnetAction: 'engage',
            moduleId: 'magModuleId',
            engageHeight: '8',
          },
          unrelatedMagnetEngageStepId: {
            stepType: 'magnet',
            magnetAction: 'engage',
            moduleId: 'otherMagModuleId', // not 'magModuleId'
            engageHeight: '8',
          },
        },
      }
      const result = savedStepForms(prevRootState, action)
      expect(result).toEqual({
        magnetEngageStepId: {
          stepType: 'magnet',
          magnetAction: 'engage',
          engageHeight: '12', // V2 units default
          moduleId: 'magModuleId',
        },
        magnetDisengageStepId:
          prevRootState.savedStepForms.magnetDisengageStepId,
        nonDefaultMagnetEngageStepId: {
          stepType: 'magnet',
          magnetAction: 'engage',
          moduleId: 'magModuleId',
          engageHeight: null,
        },
        // module id not matching, unchanged
        unrelatedMagnetEngageStepId:
          prevRootState.savedStepForms.unrelatedMagnetEngageStepId,
      })
    })
  })
})

describe('unsavedForm reducer', () => {
  const someState: any = { something: 'foo' }

  it('should take on the payload of the POPULATE_FORM action', () => {
    const payload = { formStuff: 'example' }
    const result = unsavedForm(someState, { type: 'POPULATE_FORM', payload })
    expect(result).toEqual(payload)
  })

  it('should use handleFormChange to update the state with CHANGE_FORM_INPUT action', () => {
    const rootState: any = {
      unsavedForm: { existingField: 123 },
    }
    const action = {
      type: 'CHANGE_FORM_INPUT',
      payload: { update: { someField: -1 } },
    }

    handleFormChangeMock.mockReturnValue({ someField: 42 })
    mock_getPipetteEntitiesRootState.mockReturnValue(
      'pipetteEntitiesPlaceholder'
    )
    mock_getLabwareEntitiesRootState.mockReturnValue(
      'labwareEntitiesPlaceholder'
    )

    const result = unsavedForm(rootState, action)
    expect(mock_getPipetteEntitiesRootState.mock.calls).toEqual([[rootState]])
    expect(mock_getLabwareEntitiesRootState.mock.calls).toEqual([[rootState]])
    expect(handleFormChangeMock.mock.calls).toEqual([
      [
        action.payload.update,
        rootState.unsavedForm,
        'pipetteEntitiesPlaceholder',
        'labwareEntitiesPlaceholder',
      ],
    ])
    expect(result).toEqual({ existingField: 123, someField: 42 })
  })

  it("should switch out pipettes via handleFormChange in response to SUBSTITUTE_STEP_FORM_PIPETTES if the unsaved form's ID is in range", () => {
    const action = {
      type: 'SUBSTITUTE_STEP_FORM_PIPETTES',
      payload: {
        substitutionMap: { oldPipetteId: 'newPipetteId' },
        startStepId: '3',
        endStepId: '5',
      },
    }
    const rootState = {
      orderedStepIds: ['1', '3', '4', '5', '6'],
      unsavedForm: { pipette: 'oldPipetteId', id: '4', otherField: 'blah' },
    }

    handleFormChangeMock.mockReturnValue({ pipette: 'newPipetteId' })
    mock_getPipetteEntitiesRootState.mockReturnValue(
      'pipetteEntitiesPlaceholder'
    )
    mock_getLabwareEntitiesRootState.mockReturnValue(
      'labwareEntitiesPlaceholder'
    )

    const result = unsavedForm(rootState, action)
    expect(mock_getPipetteEntitiesRootState.mock.calls).toEqual([[rootState]])
    expect(mock_getLabwareEntitiesRootState.mock.calls).toEqual([[rootState]])
    expect(handleFormChangeMock.mock.calls).toEqual([
      [
        { pipette: 'newPipetteId' },
        rootState.unsavedForm,
        'pipetteEntitiesPlaceholder',
        'labwareEntitiesPlaceholder',
      ],
    ])
    expect(result).toEqual({
      id: '4',
      pipette: 'newPipetteId',
      otherField: 'blah',
    })
  })

  const actionTypes = [
    'CANCEL_STEP_FORM',
    'SELECT_TERMINAL_ITEM',
    'SAVE_STEP_FORM',
    'DELETE_STEP',
    'EDIT_MODULE',
  ]
  actionTypes.forEach(actionType => {
    it(`should clear the unsaved form when any ${actionType} action is dispatched`, () => {
      const result = unsavedForm(someState, { type: actionType })
      expect(result).toEqual(null)
    })
  })
})

describe('presavedStepForm reducer', () => {
  it('should populate when a new step is added', () => {
    const addStepAction: AddStepAction = {
      type: 'ADD_STEP',
      payload: { id: 'someId', stepType: 'transfer' },
    }
    const result = presavedStepForm(null, addStepAction)
    expect(result).toEqual({ stepType: 'transfer' })
  })

  it('should not update when the PRESAVED_STEP_ID terminal item is selected', () => {
    const prevState = { stepType: 'transfer' }
    const action = { type: 'SELECT_TERMINAL_ITEM', payload: PRESAVED_STEP_ID }
    expect(presavedStepForm(prevState, action)).toBe(prevState)
  })

  it('should clear when a different terminal item is selected', () => {
    const prevState = { stepType: 'transfer' }
    const action = { type: 'SELECT_TERMINAL_ITEM', payload: 'otherId' }
    expect(presavedStepForm(prevState, action)).toEqual(null)
  })

  const clearingActions = [
    'CANCEL_STEP_FORM',
    'DELETE_STEP',
    'SAVE_STEP_FORM',
    'SELECT_STEP',
  ]
  clearingActions.forEach(actionType => {
    it(`should clear upon ${actionType}`, () => {
      const prevState = { id: 'someId', stepType: 'transfer' }
      expect(presavedStepForm(prevState, { type: actionType })).toEqual(null)
    })
  })
})
