// connection reducer tests
import { robotReducer as reducer } from '../'

import type { Action } from '../../types'
import type { RobotState } from '../reducer'
import type { ConnectionState } from '../reducer/connection'

const getState = (state: RobotState): ConnectionState => state.connection

describe('robot reducer - connection', () => {
  it('initial state', () => {
    const state = reducer(undefined, {} as any)

    expect(getState(state)).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: false, error: null, name: '' },
      disconnectRequest: { inProgress: false, error: null },
      unexpectedDisconnect: false,
    })
  })

  it('handles CONNECT action', () => {
    const state: RobotState = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: '',
        },
      },
    } as any
    const action: Action = {
      type: 'robot:LEGACY_CONNECT',
      payload: { name: 'ot' },
      meta: {} as any,
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: true, error: null, name: 'ot' },
    })
  })

  it('handles CONNECT action if connect already in flight', () => {
    const state: RobotState = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot',
        },
      },
    } as any
    const action: Action = {
      type: 'robot:LEGACY_CONNECT',
      payload: { name: 'someone-else' },
      meta: {} as any,
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: true, error: null, name: 'ot' },
    })
  })

  it('handles CONNECT_RESPONSE success', () => {
    const state: RobotState = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot',
        },
      },
    } as any
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {} as any,
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      connectRequest: { inProgress: false, error: null, name: '' },
    })
  })

  it('handles CONNECT_RESPONSE failure', () => {
    const state: RobotState = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot',
        },
      },
    } as any
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: new Error('AH') } as any,
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: {
        inProgress: false,
        error: new Error('AH'),
        name: 'ot',
      },
    })
  })

  it('handles CLEAR_CONNECT_RESPONSE action', () => {
    const state: RobotState = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: 'ot',
        },
      },
    } as any

    const action: Action = {
      type: 'robot:CLEAR_CONNECT_RESPONSE',
      error: false,
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: false, error: null, name: '' },
    })
  })

  it('handles DISCONNECT action', () => {
    const state: RobotState = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: '',
        },
      },
    } as any
    const action: Action = { type: 'robot:DISCONNECT', meta: {} as any }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      disconnectRequest: { inProgress: true, error: null },
    })
  })

  it('handles DISCONNECT_RESPONSE', () => {
    const state: RobotState = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: { inProgress: true, error: null },
        unexpectedDisconnect: true,
      },
    } as any
    const action: Action = { type: 'robot:DISCONNECT_RESPONSE', payload: {} }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      disconnectRequest: { inProgress: false, error: null },
      unexpectedDisconnect: false,
    })
  })
})
