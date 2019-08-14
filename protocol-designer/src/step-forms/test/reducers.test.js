// @flow
import {
  legacySteps as steps,
  orderedStepIds,
  labwareInvariantProperties,
} from '../reducers'

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
