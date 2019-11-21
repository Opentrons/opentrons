// @flow
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
        payload: [
          { type: 'BAD_JSON_LABWARE_FILE', filename: 'a.json', created: 3 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 2 },
        ],
      },
      expected: {
        ...INITIAL_STATE,
        filenames: ['a.json', 'b.json'],
        filesByName: {
          'a.json': {
            type: 'BAD_JSON_LABWARE_FILE',
            filename: 'a.json',
            created: 3,
          },
          'b.json': {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            created: 2,
          },
        },
        listFailureMessage: null,
      },
    },
    {
      name: 'handles CUSTOM_LABWARE_LIST with removed files',
      state: {
        filenames: ['a.json', 'b.json'],
        filesByName: {
          'a.json': {
            type: 'BAD_JSON_LABWARE_FILE',
            filename: 'a.json',
            created: 3,
          },
          'b.json': {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            created: 2,
          },
        },
        listFailureMessage: 'AH',
      },
      action: {
        type: 'labware:CUSTOM_LABWARE_LIST',
        payload: [
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 2 },
        ],
      },
      expected: {
        filenames: ['b.json'],
        filesByName: {
          'b.json': {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            created: 2,
          },
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
      },
      expected: { ...INITIAL_STATE, listFailureMessage: 'AH' },
    },
    {
      name: 'handles ADD_CUSTOM_LABWARE',
      state: {
        addFailureFile: {
          type: 'INVALID_LABWARE_FILE',
          filename: 'b.json',
          created: 2,
        },
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
          labware: {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            created: 2,
          },
          message: 'AH',
        },
      },
      expected: {
        ...INITIAL_STATE,
        addFailureFile: {
          type: 'INVALID_LABWARE_FILE',
          filename: 'b.json',
          created: 2,
        },
        addFailureMessage: 'AH',
      },
    },
    {
      name: 'handles CLEAR_ADD_CUSTOM_LABWARE_FAILURE',
      state: {
        addFailureFile: {
          type: 'INVALID_LABWARE_FILE',
          filename: 'b.json',
          created: 2,
        },
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

    test(name, () => {
      const result = customLabwareReducer(state, action)
      expect(result).toEqual(expected)
      // check for new reference
      expect(result).not.toBe(state)
    })
  })
})
