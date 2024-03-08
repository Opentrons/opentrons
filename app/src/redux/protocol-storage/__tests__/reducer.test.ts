import { describe, it, expect } from 'vitest'

import * as Fixtures from '../__fixtures__'
import { INITIAL_STATE, protocolStorageReducer } from '../reducer'

import type { Action } from '../../types'
import type { ProtocolStorageState } from '../types'

interface ReducerSpec {
  name: string
  state: Partial<ProtocolStorageState>
  action: Action
  expected: Partial<ProtocolStorageState>
}

const firstProtocolKey = 'first_protocol_key'
const secondProtocolKey = 'second_protocol_key'

describe('protocolStorageReducer', () => {
  const SPECS: ReducerSpec[] = [
    {
      name: 'handles UPDATE_PROTOCOL_LIST with new files',
      state: INITIAL_STATE,
      action: {
        type: 'protocolStorage:UPDATE_PROTOCOL_LIST',
        payload: [
          { ...Fixtures.storedProtocolData, protocolKey: firstProtocolKey },
          { ...Fixtures.storedProtocolData, protocolKey: secondProtocolKey },
        ],
        meta: { source: 'poll' },
      },
      expected: {
        ...INITIAL_STATE,
        protocolKeys: [firstProtocolKey, secondProtocolKey],
        filesByProtocolKey: {
          [firstProtocolKey]: {
            ...Fixtures.storedProtocolData,
            protocolKey: firstProtocolKey,
          },
          [secondProtocolKey]: {
            ...Fixtures.storedProtocolData,
            protocolKey: secondProtocolKey,
          },
        },
        listFailureMessage: null,
      },
    },
    {
      name: 'handles UPDATE_PROTOCOL_LIST with removed files',
      state: {
        protocolKeys: [firstProtocolKey, secondProtocolKey],
        filesByProtocolKey: {
          [firstProtocolKey]: {
            ...Fixtures.storedProtocolData,
            protocolKey: firstProtocolKey,
          },
          [secondProtocolKey]: {
            ...Fixtures.storedProtocolData,
            protocolKey: secondProtocolKey,
          },
        },
        listFailureMessage: 'AH',
      },
      action: {
        type: 'protocolStorage:UPDATE_PROTOCOL_LIST',
        payload: [
          { ...Fixtures.storedProtocolData, protocolKey: firstProtocolKey },
        ],
        meta: { source: 'poll' },
      },
      expected: {
        protocolKeys: [firstProtocolKey],
        filesByProtocolKey: {
          [firstProtocolKey]: {
            ...Fixtures.storedProtocolData,
            protocolKey: firstProtocolKey,
          },
        },
        listFailureMessage: null,
      },
    },
    {
      name: 'handles UPDATE_PROTOCOL_LIST_FAILURE',
      state: INITIAL_STATE,
      action: {
        type: 'protocolStorage:UPDATE_PROTOCOL_LIST_FAILURE',
        payload: { message: 'AH' },
        meta: { source: 'poll' },
      },
      expected: { ...INITIAL_STATE, listFailureMessage: 'AH' },
    },
    {
      name: 'handles ADD_PROTOCOL',
      state: {
        addFailureFile: Fixtures.storedProtocolDir,
        addFailureMessage: 'AH',
      },
      action: {
        type: 'protocolStorage:ADD_PROTOCOL',
        payload: { protocolFilePath: 'path/to/protocol' },
        meta: { shell: true },
      },
      expected: {
        addFailureFile: null,
        addFailureMessage: null,
      },
    },
    {
      name: 'handles ADD_PROTOCOL_FAILURE',
      state: INITIAL_STATE,
      action: {
        type: 'protocolStorage:ADD_PROTOCOL_FAILURE',
        payload: {
          protocol: Fixtures.storedProtocolDir,
          message: 'AH',
        },
      },
      expected: {
        ...INITIAL_STATE,
        addFailureFile: Fixtures.storedProtocolDir,
        addFailureMessage: 'AH',
      },
    },
    {
      name: 'handles CLEAR_ADD_PROTOCOL_FAILURE',
      state: {
        addFailureFile: Fixtures.storedProtocolDir,
        addFailureMessage: 'AH',
      },
      action: { type: 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE' },
      expected: {
        addFailureFile: null,
        addFailureMessage: null,
      },
    },
    {
      name: 'handles ANALYZE_PROTOCOL',
      state: INITIAL_STATE,
      action: {
        type: 'protocolStorage:ANALYZE_PROTOCOL',
        payload: {
          protocolKey: 'fakeProtocolKey',
        },
        meta: { shell: true },
      },
      expected: {
        ...INITIAL_STATE,
        inProgressAnalysisProtocolKeys: ['fakeProtocolKey'],
      },
    },
    {
      name: 'handles ANALYZE_PROTOCOL_SUCCESS',
      state: {
        ...INITIAL_STATE,
        inProgressAnalysisProtocolKeys: ['fakeProtocolKey'],
      },
      action: {
        type: 'protocolStorage:ANALYZE_PROTOCOL_SUCCESS',
        payload: {
          protocolKey: 'fakeProtocolKey',
        },
        meta: { shell: true },
      },
      expected: {
        ...INITIAL_STATE,
        inProgressAnalysisProtocolKeys: [],
      },
    },
    {
      name: 'handles ANALYZE_PROTOCOL_FAILURE',
      state: {
        ...INITIAL_STATE,
        inProgressAnalysisProtocolKeys: ['fakeProtocolKey'],
      },
      action: {
        type: 'protocolStorage:ANALYZE_PROTOCOL_FAILURE',
        payload: {
          protocolKey: 'fakeProtocolKey',
        },
        meta: { shell: true },
      },
      expected: {
        ...INITIAL_STATE,
        inProgressAnalysisProtocolKeys: [],
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec

    it(name, () => {
      const result = protocolStorageReducer(
        state as ProtocolStorageState,
        action
      )
      expect(result).toEqual(expected)
      // check for new reference
      expect(result).not.toBe(state)
    })
  })
})
