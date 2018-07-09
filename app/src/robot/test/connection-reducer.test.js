// connection reducer tests
import {reducer} from '../'

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
    const action = {type: 'robot:DISCOVER'}

    expect(getState(reducer(state, action))).toEqual({
      isScanning: true
    })
  })

  test('handles DISCOVER_FINISH action', () => {
    const state = {
      connection: {isScanning: true}
    }
    const action = {type: 'robot:DISCOVER_FINISH'}

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
      type: 'robot:CONNECT',
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
    const action = {type: 'robot:CONNECT_RESPONSE', payload: {}}

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
      type: 'robot:CONNECT_RESPONSE',
      payload: {error: new Error('AH')}
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

  test('handles CLEAR_CONNECT_RESPONSE action', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {
          inProgress: false,
          error: new Error('AH'),
          name: 'ot'
        }
      }
    }

    const action = {type: 'robot:CLEAR_CONNECT_RESPONSE', error: false}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: '',
      connectRequest: {inProgress: false, error: null, name: ''}
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
    const action = {type: 'robot:DISCONNECT'}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: 'ot',
      disconnectRequest: {inProgress: true, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE', () => {
    const state = {
      connection: {
        connectedTo: 'ot',
        disconnectRequest: {inProgress: true, error: null}
      }
    }
    const action = {type: 'robot:DISCONNECT_RESPONSE', payload: {}}

    expect(getState(reducer(state, action))).toEqual({
      connectedTo: '',
      disconnectRequest: {inProgress: false, error: null}
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
      type: 'robot:ADD_DISCOVERED',
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
      type: 'robot:ADD_DISCOVERED',
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
      type: 'robot:REMOVE_DISCOVERED',
      payload: {name: 'foo'}
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['bar'],
      discoveredByName: {
        bar: {host: '123456.local', name: 'bar'}
      }
    })
  })

  test('adds wired robot to discovered on /health api:SUCCESS', () => {
    const state = {
      connection: {
        discovered: ['foo'],
        discoveredByName: {
          foo: {name: 'foo', host: 'abcdef.local'}
        }
      }
    }

    const action = {
      type: 'api:SUCCESS',
      payload: {
        robot: {name: 'bar', host: 'ghijkl.local', wired: true},
        path: 'health'
      }
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['foo', 'bar'],
      discoveredByName: {
        foo: {name: 'foo', host: 'abcdef.local'},
        bar: {name: 'bar', host: 'ghijkl.local', wired: true}
      }
    })
  })

  test('removes wired robot from discovered on /health api:FAILURE', () => {
    const state = {
      connection: {
        discovered: ['foo', 'bar'],
        discoveredByName: {
          foo: {name: 'foo', host: 'abcdef.local'},
          bar: {name: 'bar', host: 'ghijkl.local', wired: true}
        }
      }
    }

    const action = {
      type: 'api:FAILURE',
      payload: {
        robot: {name: 'bar', host: 'ghijkl.local', wired: true},
        path: 'health'
      }
    }

    expect(getState(reducer(state, action))).toEqual({
      discovered: ['foo'],
      discoveredByName: {
        foo: {name: 'foo', host: 'abcdef.local'}
      }
    })
  })
})
