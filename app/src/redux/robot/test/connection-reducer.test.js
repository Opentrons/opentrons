// connection reducer tests
import { robotReducer as reducer } from '../'

const getState = state => state.connection

describe('robot reducer - connection', () => {
  it('initial state', () => {
    const state = reducer(undefined, {})

    expect(getState(state)).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: false, error: null, name: '' },
      disconnectRequest: { inProgress: false, error: null },
      unexpectedDisconnect: false,
    })
  })

  it('handles CONNECT action', () => {
    const state = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: '',
        },
      },
    }
    const action = {
      type: 'robot:CONNECT',
      payload: { name: 'ot' },
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: true, error: null, name: 'ot' },
    })
  })

  it('handles CONNECT action if connect already in flight', () => {
    const state = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot',
        },
      },
    }
    const action = {
      type: 'robot:CONNECT',
      payload: { name: 'someone-else' },
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: true, error: null, name: 'ot' },
    })
  })

  it('handles CONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot',
        },
      },
    }
    const action = { type: 'robot:CONNECT_RESPONSE', payload: {} }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      connectRequest: { inProgress: false, error: null, name: '' },
    })
  })

  it('handles CONNECT_RESPONSE failure', () => {
    const state = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot',
        },
      },
    }
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: new Error('AH') },
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
    const state = {
      connection: {
        connectedTo: null,
        connectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: 'ot',
        },
      },
    }

    const action = { type: 'robot:CLEAR_CONNECT_RESPONSE', error: false }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: { inProgress: false, error: null, name: '' },
    })
  })

  it('handles DISCONNECT action', () => {
    const state = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: '',
        },
      },
    }
    const action = { type: 'robot:DISCONNECT' }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      disconnectRequest: { inProgress: true, error: null },
    })
  })

  it('handles DISCONNECT_RESPONSE', () => {
    const state = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: { inProgress: true, error: null },
        unexpectedDisconnect: true,
      },
    }
    const action = { type: 'robot:DISCONNECT_RESPONSE', payload: {} }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      disconnectRequest: { inProgress: false, error: null },
      unexpectedDisconnect: false,
    })
  })
})
