// connection reducer tests
import {reducer, actionTypes} from '../'

const getState = (state) => state.connection

describe('robot reducer - connection', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(getState(state)).toEqual({
      isScanning: false,
      discovered: [],
      discoveredByHost: {},
      connectedTo: '',
      connectRequest: {inProgress: false, error: null, host: ''},
      disconnectRequest: {inProgress: false, error: null}
    })
  })

  test('handles DISCOVER action', () => {
    const state = {
      connection: {isScanning: false}
    }
    const action = {type: actionTypes.DISCOVER}

    expect(getState(reducer(state, action))).toEqual({
      isScanning: true
    })
  })

  test('handles DISCOVER_FINISH action', () => {
    const state = {
      connection: {isScanning: true}
    }
    const action = {type: actionTypes.DISCOVER_FINISH}

    expect(getState(reducer(state, action))).toEqual({
      isScanning: false
    })
  })

  test('handles CONNECT action', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {
          inProgress: false,
          error: new Error('AH'),
          host: ''
        }
      }
    }
    const action = {
      type: actionTypes.CONNECT,
      payload: {host: 'ot.local'}
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: '',
      connectRequest: {inProgress: true, error: null, host: 'ot.local'}
    })
  })

  test('handles CONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {
          inProgress: true,
          error: null,
          host: 'ot.local'
        }
      }
    }
    const action = {type: actionTypes.CONNECT_RESPONSE, error: false}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot.local',
      connectRequest: {inProgress: false, error: null, host: ''}
    })
  })

  test('handles CONNECT_RESPONSE failure', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {
          inProgress: true,
          error: null,
          host: 'ot.local'
        }
      }
    }
    const action = {
      type: actionTypes.CONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: '',
      connectRequest: {
        inProgress: false,
        error: new Error('AH'),
        host: 'ot.local'
      }
    })
  })

  test('handles DISCONNECT action', () => {
    const state = {
      connection: {
        connectedTo: 'ot.local',
        disconnectRequest: {
          inProgress: false,
          error: new Error('AH'),
          host: ''
        }
      }
    }
    const action = {type: actionTypes.DISCONNECT}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot.local',
      disconnectRequest: {inProgress: true, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        connectedTo: 'ot.local',
        disconnectRequest: {inProgress: true, error: null}
      }
    }
    const action = {type: actionTypes.DISCONNECT_RESPONSE, error: false}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: '',
      disconnectRequest: {inProgress: false, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE failure', () => {
    const state = {
      connection: {
        connectedTo: 'ot.local',
        disconnectRequest: {inProgress: true, error: null}
      }
    }
    const action = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot.local',
      disconnectRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles ADD_DISCOVERED action', () => {
    const state = {
      connection: {
        discovered: ['abcdef.local'],
        discoveredByHost: {
          'abcdef.local': {host: 'abcdef.local', name: 'foo'}
        }
      }
    }
    const action = {
      type: actionTypes.ADD_DISCOVERED,
      payload: {host: '123456.local', name: 'bar'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['abcdef.local', '123456.local'],
      discoveredByHost: {
        'abcdef.local': {host: 'abcdef.local', name: 'foo'},
        '123456.local': {host: '123456.local', name: 'bar'}
      }
    })
  })

  test('handles ADD_DISCOVERED action when robot is already present', () => {
    const state = {
      connection: {
        discovered: ['abcdef.local'],
        discoveredByHost: {
          'abcdef.local': {host: 'abcdef.local', name: 'foo'}
        }
      }
    }
    const action = {
      type: actionTypes.ADD_DISCOVERED,
      payload: {host: 'abcdef.local', name: 'foo'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['abcdef.local'],
      discoveredByHost: {
        'abcdef.local': {host: 'abcdef.local', name: 'foo'}
      }
    })
  })

  test('handles REMOVE_DISCOVERED action', () => {
    const state = {
      connection: {
        discovered: ['abcdef.local', '123456.local'],
        discoveredByHost: {
          'abcdef.local': {host: 'abcdef.local', name: 'foo'},
          '123456.local': {host: '123456.local', name: 'bar'}
        }
      }
    }
    const action = {
      type: actionTypes.REMOVE_DISCOVERED,
      payload: {host: 'abcdef.local'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['123456.local'],
      discoveredByHost: {
        '123456.local': {host: '123456.local', name: 'bar'}
      }
    })
  })
})
