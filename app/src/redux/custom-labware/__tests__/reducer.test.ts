// @flow
import * as Fixtures from '../__fixtures__'
import { INITIAL_STATE, customLabwareReducer } from '../reducer'

import type { Action } from '../../types'
import type { CustomLabwareState } from '../types'

type ReducerSpec = {|
  name: string,
  state: $Shape<CustomLabwareState>,
  action: Action,
  expected: $Shape<CustomLabwareState>,
|}

describe('customLabwareReducer', () => {
  const SPECS: Array<ReducerSpec> = [
    {
      name: 'handles CUSTOM_LABWARE_LIST with new files',
      state: INITIAL_STATE,
      action: {
        type: 'labware:CUSTOM_LABWARE_LIST',
        payload: [Fixtures.mockInvalidLabware, Fixtures.mockValidLabware],
        meta: { source: 'poll' },
      },
      expected: {
        ...INITIAL_STATE,
        filenames: [
          Fixtures.mockInvalidLabware.filename,
          Fixtures.mockValidLabware.filename,
        ],
        filesByName: {
          [Fixtures.mockInvalidLabware.filename]: Fixtures.mockInvalidLabware,
          [Fixtures.mockValidLabware.filename]: Fixtures.mockValidLabware,
        },
        listFailureMessage: null,
      },
    },
    {
      name: 'handles CUSTOM_LABWARE_LIST with removed files',
      state: {
        filenames: [
          Fixtures.mockInvalidLabware.filename,
          Fixtures.mockValidLabware.filename,
        ],
        filesByName: {
          [Fixtures.mockInvalidLabware.filename]: Fixtures.mockInvalidLabware,
          [Fixtures.mockValidLabware.filename]: Fixtures.mockValidLabware,
        },
        listFailureMessage: 'AH',
      },
      action: {
        type: 'labware:CUSTOM_LABWARE_LIST',
        payload: [Fixtures.mockInvalidLabware],
        meta: { source: 'poll' },
      },
      expected: {
        filenames: [Fixtures.mockInvalidLabware.filename],
        filesByName: {
          [Fixtures.mockInvalidLabware.filename]: Fixtures.mockInvalidLabware,
        },
        listFailureMessage: null,
      },
    },
    {
      name: 'handles CUSTOM_LABWARE_LIST_FAILURE',
      state: INITIAL_STATE,
      action: {
        type: 'labware:CUSTOM_LABWARE_LIST_FAILURE',
        payload: { message: 'AH' },
        meta: { source: 'poll' },
      },
      expected: { ...INITIAL_STATE, listFailureMessage: 'AH' },
    },
    {
      name: 'handles ADD_CUSTOM_LABWARE',
      state: {
        addFailureFile: Fixtures.mockInvalidLabware,
        addFailureMessage: 'AH',
      },
      action: {
        type: 'labware:ADD_CUSTOM_LABWARE',
        payload: { overwrite: null },
        meta: { shell: true },
      },
      expected: {
        addFailureFile: null,
        addFailureMessage: null,
      },
    },
    {
      name: 'handles ADD_CUSTOM_LABWARE_FAILURE',
      state: INITIAL_STATE,
      action: {
        type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
        payload: {
          labware: Fixtures.mockInvalidLabware,
          message: 'AH',
        },
      },
      expected: {
        ...INITIAL_STATE,
        addFailureFile: Fixtures.mockInvalidLabware,
        addFailureMessage: 'AH',
      },
    },
    {
      name: 'handles CLEAR_ADD_CUSTOM_LABWARE_FAILURE',
      state: {
        addFailureFile: Fixtures.mockInvalidLabware,
        addFailureMessage: 'AH',
      },
      action: { type: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE' },
      expected: {
        addFailureFile: null,
        addFailureMessage: null,
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec

    it(name, () => {
      const result = customLabwareReducer(state, action)
      expect(result).toEqual(expected)
      // check for new reference
      expect(result).not.toBe(state)
    })
  })
})
