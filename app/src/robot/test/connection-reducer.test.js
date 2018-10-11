// connection reducer tests
import {reducer} from '../'

const getState = (state) => state.connection

describe('robot reducer - connection', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(getState(state)).toEqual({
      connectedTo: null,
      connectRequest: {inProgress: false, error: null, name: ''},
      disconnectRequest: {inProgress: false, error: null},
      unexpectedDisconnect: false,
    })
  })

  test('handles CONNECT action', () => {
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
      payload: {name: 'ot'},
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: {inProgress: true, error: null, name: 'ot'},
    })
  })

  test('handles CONNECT_RESPONSE success', () => {
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
    const action = {type: 'robot:CONNECT_RESPONSE', payload: {}}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      connectRequest: {inProgress: false, error: null, name: ''},
    })
  })

  test('handles CONNECT_RESPONSE failure', () => {
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
      payload: {error: new Error('AH')},
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

  test('handles CLEAR_CONNECT_RESPONSE action', () => {
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

    const action = {type: 'robot:CLEAR_CONNECT_RESPONSE', error: false}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      connectRequest: {inProgress: false, error: null, name: ''},
    })
  })

  test('handles DISCONNECT action', () => {
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
    const action = {type: 'robot:DISCONNECT'}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      disconnectRequest: {inProgress: true, error: null},
    })
  })

  test('handles DISCONNECT_RESPONSE', () => {
    const state = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: {inProgress: true, error: null},
        unexpectedDisconnect: true,
      },
    }
    const action = {type: 'robot:DISCONNECT_RESPONSE', payload: {}}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: null,
      disconnectRequest: {inProgress: false, error: null},
      unexpectedDisconnect: false,
    })
  })
})
