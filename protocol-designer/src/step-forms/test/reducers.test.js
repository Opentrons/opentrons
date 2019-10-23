// @flow
import {
  legacySteps as steps,
  orderedStepIds,
  labwareInvariantProperties,
  moduleInvariantProperties,
  savedStepForms,
} from '../reducers'
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

describe('savedStepForms reducer', () => {
  const existingLabwareId = 'existingLabwareId'
  let prevRootState: any = {
    // TODO IMMEDIATELY create prevRootState in beforeEach or a fn
    savedStepForms: {
      [INITIAL_DECK_SETUP_STEP_ID]: {
        labwareLocationUpdate: { [existingLabwareId]: '1' },
        /* TODO IMMEDIATELY: moduleLocationUpdate */
      },
    },
  }

  describe('create (or duplicate) new labware', () => {
    const newLabwareId = 'newLabwareId'
    const newSlot = '8'
    const prevDeckSetupStep =
      prevRootState.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
    const expected = {
      [INITIAL_DECK_SETUP_STEP_ID]: {
        ...prevDeckSetupStep,
        labwareLocationUpdate: {
          ...prevDeckSetupStep.labwareLocationUpdate,
          [newLabwareId]: newSlot,
        },
      },
    }
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
        testName: `create container in slot ${newSlot}`,
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
        const result = savedStepForms(prevRootState, action)
        expect(result).toEqual(expected)
      })
    })
  })
})
