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
