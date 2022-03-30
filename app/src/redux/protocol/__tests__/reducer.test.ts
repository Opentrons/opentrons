// protocol state reducer tests

import { protocolReducer } from '../reducer'
import type { Action } from '../../types'
import type { ProtocolState } from '../types'

describe('protocolReducer', () => {
  it('initial state', () => {
    expect(protocolReducer(undefined, {} as any)).toEqual({
      file: null,
      contents: null,
      data: null,
    })
  })

  const SPECS: Array<{
    name: string
    action: Action
    initialState: ProtocolState
    expectedState: ProtocolState
  }> = [
    {
      name: 'handles protocol:OPEN',
      action: {
        type: 'protocol:OPEN',
        payload: { file: { name: 'proto.py' } as any },
      },
      initialState: { file: {}, contents: 'foobar', data: {} } as any,
      expectedState: {
        file: { name: 'proto.py' },
        contents: null,
        data: null,
      } as any,
    },
    {
      name: 'handles protocol:UPLOAD',
      action: {
        type: 'protocol:UPLOAD',
        payload: { contents: 'foo', data: {} },
      } as any,
      initialState: {
        file: { name: 'proto.py' },
        contents: null,
        data: null,
      } as any,
      expectedState: {
        file: { name: 'proto.py' },
        contents: 'foo',
        data: {},
      } as any,
    },
    {
      name: 'handles robot:DISCONNECT by clearing state',
      action: { type: 'robot:DISCONNECT' },
      initialState: { file: { name: 'proto.py' }, contents: 'foo', data: {} },
      expectedState: { file: null, contents: null, data: null },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expectedState } = spec

    it(name, () => {
      expect(protocolReducer(initialState, action)).toEqual(expectedState)
    })
  })
})
