// @flow
import {
  legacySteps as steps,
  orderedStepIds,
  labwareInvariantProperties,
  moduleInvariantProperties,
  savedStepForms,
} from '../reducers'
import { moveDeckItem } from '../../labware-ingred/actions'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'

jest.mock('../../labware-defs/utils')

describe('steps reducer', () => {
  test('initial add step', () => {
    const state = {}
    const action = {
      type: 'ADD_STEP',
      payload: { id: '123', stepType: 'moveLiquid' },
    }

    expect(steps(state, action)).toEqual({
      '123': {
        id: '123',
        stepType: 'moveLiquid',
      },
    })
  })

  test('second add step', () => {
    const state = {
      '333': {
        id: '333',
        stepType: 'mix',
      },
    }
    const action = {
      type: 'ADD_STEP',
      payload: { id: '123', stepType: 'moveLiquid' },
    }

    expect(steps(state, action)).toEqual({
      '333': {
        id: '333',
        stepType: 'mix',
      },
      '123': {
        id: '123',
        stepType: 'moveLiquid',
      },
    })
  })
})

describe('orderedStepIds reducer', () => {
  test('initial add step', () => {
    const state = []
    const action = {
      type: 'ADD_STEP',
      payload: { id: '123', stepType: 'moveLiquid' },
    }
    expect(orderedStepIds(state, action)).toEqual(['123'])
  })

  test('second add step', () => {
    const state = ['123']
    const action = {
      type: 'ADD_STEP',
      payload: { id: '22', stepType: 'moveLiquid' },
    }
    expect(orderedStepIds(state, action)).toEqual(['123', '22'])
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
      test(label, () => {
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
  test('replace custom labware def', () => {
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
      [existingModuleId]: { slot: '1', type: 'magdeck', model: 'GEN1' },
    }
  })

  test('create module', () => {
    const newModuleData = {
      id: newId,
      slot: '3',
      type: 'tempdeck',
      model: 'GEN1',
    }
    const result = moduleInvariantProperties(prevState, {
      type: 'CREATE_MODULE',
      payload: newModuleData,
    })
    expect(result).toEqual({
      ...prevState,
      [newId]: { type: newModuleData.type, model: newModuleData.model },
    })
  })

  test('edit module (change its model)', () => {
    const newModel = 'GEN2'
    const result = moduleInvariantProperties(prevState, {
      type: 'EDIT_MODULE',
      payload: { id: existingModuleId, model: newModel },
    })
    expect(result).toEqual({
      [existingModuleId]: { ...prevState.existingModuleId, model: newModel },
    })
  })

  test('delete module', () => {
    const result = moduleInvariantProperties(prevState, {
      type: 'DELETE_MODULE',
      payload: { id: existingModuleId },
    })
    expect(result).toEqual({})
  })
})

type MakeDeckSetupStepArgs = {
  // TODO IMMEDIATELY: type properly
  labwareLocationUpdate?: Object,
  pipetteLocationUpdate?: Object,
  moduleLocationUpdate?: Object,
}

const makeDeckSetupStep = (args: MakeDeckSetupStepArgs) => ({
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
      test(testName, () => {
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
    const sourceSlot = '1'
    const destSlot = '3'
    const testCases: Array<{|
      testName: string,
      makeStateArgs: MakeDeckSetupStepArgs,
      expectedLabwareLocations?: Object,
      expectedModuleLocations?: Object,
    |}> = [
      {
        testName: 'move labware to empty slot -> simple move',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: sourceSlot,
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: destSlot,
        },
      },
      {
        testName: 'move labware to slot with labware -> swap labware',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: sourceSlot,
            [otherLabwareId]: destSlot,
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: destSlot,
          [otherLabwareId]: sourceSlot,
        },
      },
      {
        testName:
          'move labware to slot with empty module -> labware added to module',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: sourceSlot,
          },
          moduleLocationUpdate: {
            [moduleId]: destSlot,
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: destSlot,
        },
        expectedModuleLocations: {
          [moduleId]: destSlot,
        },
      },
      {
        // NOTE: if labware is incompatible, it's up to the UI to block this.
        testName:
          'move labware to slot with occupied module -> swap labware, module stays',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: sourceSlot,
            [labwareOnModuleId]: destSlot,
          },
          moduleLocationUpdate: {
            [moduleId]: destSlot,
          },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: destSlot,
          [labwareOnModuleId]: sourceSlot,
        },
        expectedModuleLocations: {
          [moduleId]: destSlot,
        },
      },
      {
        testName: 'move empty module to empty slot -> simple move',
        makeStateArgs: {
          labwareLocationUpdate: {},
          moduleLocationUpdate: {
            [moduleId]: sourceSlot,
          },
        },
        expectedLabwareLocations: {},
        expectedModuleLocations: { [moduleId]: destSlot },
      },
      {
        testName:
          'move empty module to slot with labware -> swap slots, do not add labware to module',
        makeStateArgs: {
          labwareLocationUpdate: { [existingLabwareId]: destSlot },
          moduleLocationUpdate: { [moduleId]: sourceSlot },
        },
        expectedLabwareLocations: { [existingLabwareId]: sourceSlot },
        expectedModuleLocations: { [moduleId]: destSlot },
      },
      {
        testName:
          'move occupied module to slot with labware -> swap slots, do not change labware on module',
        makeStateArgs: {
          labwareLocationUpdate: {
            [existingLabwareId]: destSlot,
            [labwareOnModuleId]: sourceSlot,
          },
          moduleLocationUpdate: { [moduleId]: sourceSlot },
        },
        expectedLabwareLocations: {
          [existingLabwareId]: sourceSlot,
          [labwareOnModuleId]: destSlot,
        },
        expectedModuleLocations: { [moduleId]: destSlot },
      },
      {
        testName: 'move labware off of module to empty slot',
        makeStateArgs: {
          labwareLocationUpdate: {
            [labwareOnModuleId]: sourceSlot,
          },
          moduleLocationUpdate: { [moduleId]: sourceSlot },
        },
        expectedLabwareLocations: { [labwareOnModuleId]: destSlot },
        expectedModuleLocations: { [moduleId]: sourceSlot },
      },
      // TODO IMMEDIATELY: add cases for:
      // - empty module to occupied module
      // - empty module to empty module
      // - occupied module to occupied module
      // - occupied module to empty module
      // NOTE. None of these cases change the pairings, all just swap with no pairing change
    ]
    testCases.forEach(
      ({
        testName,
        makeStateArgs,
        expectedLabwareLocations,
        expectedModuleLocations,
      }) => {
        test(testName, () => {
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

  test('delete labware -> removes labware from initial deck setup step', () => {
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

  test('delete pipettes -> removes pipette(s) from initial deck setup step', () => {
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

  test('delete module -> removes module from initial deck setup step', () => {
    // TODO IMMEDIATELY
  })
})
