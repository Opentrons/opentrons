// connection reducer tests
import {reducer, actionTypes} from '../'

const getState = (state) => state.connection

describe('robot reducer - connection', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(getState(state)).toEqual({
      isScanning: false,
      discovered: [],
      discoveredByName: {},
      connectedTo: '',
      connectRequest: {inProgress: false, error: null, name: ''},
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
          name: ''
        }
      }
    }
    const action = {
      type: actionTypes.CONNECT,
      payload: {name: 'ot'}
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: '',
      connectRequest: {inProgress: true, error: null, name: 'ot'}
    })
  })

  test('handles CONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot'
        }
      }
    }
    const action = {type: actionTypes.CONNECT_RESPONSE, error: false}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      connectRequest: {inProgress: false, error: null, name: ''}
    })
  })

  test('handles CONNECT_RESPONSE failure', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {
          inProgress: true,
          error: null,
          name: 'ot'
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
        name: 'ot'
      }
    })
  })

  test('handles DISCONNECT action', () => {
    const state = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: ''
        }
      }
    }
    const action = {type: actionTypes.DISCONNECT}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      disconnectRequest: {inProgress: true, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        connectedTo: 'ot',
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
        connectedTo: 'ot',
        disconnectRequest: {inProgress: true, error: null}
      }
    }
    const action = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      disconnectRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles ADD_DISCOVERED action', () => {
    const state = {
      connection: {
        discovered: ['foo'],
        discoveredByName: {
          foo: {host: 'abcdef.local', name: 'foo'}
        }
      }
    }
    const action = {
      type: actionTypes.ADD_DISCOVERED,
      payload: {host: '123456.local', name: 'bar'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['foo', 'bar'],
      discoveredByName: {
        foo: {host: 'abcdef.local', name: 'foo'},
        bar: {host: '123456.local', name: 'bar'}
      }
    })
  })

  test('handles ADD_DISCOVERED action when robot is already present', () => {
    const state = {
      connection: {
        discovered: ['foo'],
        discoveredByName: {
          foo: {host: 'abcdef.local', name: 'foo'}
        }
      }
    }
    const action = {
      type: actionTypes.ADD_DISCOVERED,
      payload: {host: 'abcdef.local', name: 'foo'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['foo'],
      discoveredByName: {
        foo: {host: 'abcdef.local', name: 'foo'}
      }
    })
  })

  test('handles REMOVE_DISCOVERED action', () => {
    const state = {
      connection: {
        discovered: ['foo', 'bar'],
        discoveredByName: {
          foo: {host: 'abcdef.local', name: 'foo'},
          bar: {host: '123456.local', name: 'bar'}
        }
      }
    }
    const action = {
      type: actionTypes.REMOVE_DISCOVERED,
      payload: {name: 'foo'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['bar'],
      discoveredByName: {
        bar: {host: '123456.local', name: 'bar'}
      }
    })
  })
})
