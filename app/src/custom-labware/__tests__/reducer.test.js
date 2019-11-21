// @flow
import { INITIAL_STATE, customLabwareReducer } from '../reducer'

import type { Action } from '../../types'
import type { CustomLabwareState } from '../types'

type ReducerSpec = {|
  name: string,
  state: CustomLabwareState,
  action: Action,
  expected: CustomLabwareState,
|}

describe('customLabwareReducer', () => {
  const SPECS: Array<ReducerSpec> = [
    {
      name: 'handles CUSTOM_LABWARE with new files',
      state: INITIAL_STATE,
      action: {
        type: 'labware:CUSTOM_LABWARE',
        payload: [
          { type: 'BAD_JSON_LABWARE_FILE', filename: 'a.json', created: 3 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 2 },
        ],
      },
      expected: {
        addFileFailure: null,
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
      },
    },
    {
      name: 'handles CUSTOM_LABWARE with removed files',
      state: {
        addFileFailure: null,
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
      },
      action: {
        type: 'labware:CUSTOM_LABWARE',
        payload: [
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 2 },
        ],
      },
      expected: {
        addFileFailure: null,
        filenames: ['b.json'],
        filesByName: {
          'b.json': {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            created: 2,
          },
        },
      },
    },
    {
      name: 'handles ADD_CUSTOM_LABWARE',
      state: {
        addFileFailure: {
          type: 'INVALID_LABWARE_FILE',
          filename: 'b.json',
          created: 2,
        },
        filenames: [],
        filesByName: {},
      },
      action: {
        type: 'labware:ADD_CUSTOM_LABWARE',
        meta: { shell: true },
      },
      expected: {
        addFileFailure: null,
        filenames: [],
        filesByName: {},
      },
    },
    {
      name: 'handles ADD_CUSTOM_LABWARE_FAILURE',
      state: {
        addFileFailure: null,
        filenames: [],
        filesByName: {},
      },
      action: {
        type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
        payload: {
          labware: {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            created: 2,
          },
        },
      },
      expected: {
        addFileFailure: {
          type: 'INVALID_LABWARE_FILE',
          filename: 'b.json',
          created: 2,
        },
        filenames: [],
        filesByName: {},
      },
    },
    {
      name: 'handles CLEAR_ADD_CUSTOM_LABWARE_FAILURE',
      state: {
        addFileFailure: {
          type: 'INVALID_LABWARE_FILE',
          filename: 'b.json',
          created: 2,
        },
        filenames: [],
        filesByName: {},
      },
      action: { type: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE' },
      expected: {
        addFileFailure: null,
        filenames: [],
        filesByName: {},
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
