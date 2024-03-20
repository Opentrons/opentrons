import { describe, it, expect } from 'vitest'

import * as Fixtures from '../__fixtures__'
import * as actions from '../actions'

import type { Action } from '../../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args?: unknown[]
  expected: Action
}

describe('protocol storage actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'fetchProtocols',
      creator: actions.fetchProtocols,
      expected: {
        type: 'protocolStorage:FETCH_PROTOCOLS',
        meta: { shell: true },
      },
    },
    {
      name: 'updateProtocolList',
      creator: actions.updateProtocolList,
      args: [[Fixtures.storedProtocolData]],
      expected: {
        type: 'protocolStorage:UPDATE_PROTOCOL_LIST',
        payload: [Fixtures.storedProtocolData],
        meta: { source: 'poll' },
      },
    },
    {
      name: 'updateProtocolListFailure',
      creator: actions.updateProtocolListFailure,
      args: ['AH!'],
      expected: {
        type: 'protocolStorage:UPDATE_PROTOCOL_LIST_FAILURE',
        payload: { message: 'AH!' },
        meta: { source: 'poll' },
      },
    },
    {
      name: 'addProtocol',
      creator: actions.addProtocol,
      args: ['path/to/file'],
      expected: {
        type: 'protocolStorage:ADD_PROTOCOL',
        payload: { protocolFilePath: 'path/to/file' },
        meta: { shell: true },
      },
    },
    {
      name: 'addProtocolFailure with failed protocol',
      creator: actions.addProtocolFailure,
      args: [Fixtures.storedProtocolDir, 'BADDD'],
      expected: {
        type: 'protocolStorage:ADD_PROTOCOL_FAILURE',
        payload: {
          message: 'BADDD',
          protocol: Fixtures.storedProtocolDir,
        },
      },
    },
    {
      name: 'clearAddProtocolFailure',
      creator: actions.clearAddProtocolFailure,
      args: [],
      expected: { type: 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE' },
    },
    {
      name: 'openProtocolDirectory',
      creator: actions.openProtocolDirectory,
      args: [],
      expected: {
        type: 'protocolStorage:OPEN_PROTOCOL_DIRECTORY',
        meta: { shell: true },
      },
    },
    {
      name: 'analyzeProtocol',
      creator: actions.analyzeProtocol,
      args: ['fakeProtocolKey'],
      expected: {
        type: 'protocolStorage:ANALYZE_PROTOCOL',
        payload: { protocolKey: 'fakeProtocolKey' },
        meta: { shell: true },
      },
    },
    {
      name: 'analyzeProtocolSuccess',
      creator: actions.analyzeProtocolSuccess,
      args: ['fakeProtocolKey'],
      expected: {
        type: 'protocolStorage:ANALYZE_PROTOCOL_SUCCESS',
        payload: { protocolKey: 'fakeProtocolKey' },
        meta: { shell: true },
      },
    },
    {
      name: 'analyzeProtocolFailure',
      creator: actions.analyzeProtocolFailure,
      args: ['fakeProtocolKey'],
      expected: {
        type: 'protocolStorage:ANALYZE_PROTOCOL_FAILURE',
        payload: { protocolKey: 'fakeProtocolKey' },
        meta: { shell: true },
      },
    },
    {
      name: 'viewProtocolSourceFolder',
      creator: actions.viewProtocolSourceFolder,
      args: ['fakeProtocolKey'],
      expected: {
        type: 'protocolStorage:VIEW_PROTOCOL_SOURCE_FOLDER',
        payload: { protocolKey: 'fakeProtocolKey' },
        meta: { shell: true },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, expected, args = [] } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
