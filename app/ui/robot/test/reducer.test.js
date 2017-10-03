// robot reducer test

import {reducer, actionTypes} from '../'

jest.useFakeTimers()

describe('robot reducer', () => {
  const now = Date.now()
  const _nowFn = Date.now

  beforeAll(() => (Date.now = () => now))
  afterAll(() => (Date.now = _nowFn))

  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      connectRequest: {inProgress: false, error: null},
      disconnectRequest: {inProgress: false, error: null},
      isConnected: false,

      sessionRequest: {inProgress: false, error: null},
      sessionName: '',
      protocolText: '',
      protocolCommands: [],
      protocolCommandsById: {},
      sessionErrors: [],
      sessionState: '',

      homeRequest: {inProgress: false, error: null},

      runRequest: {inProgress: false, error: null},
      pauseRequest: {inProgress: false, error: null},
      resumeRequest: {inProgress: false, error: null},
      cancelRequest: {inProgress: false, error: null},
      runTime: 0
    })
  })

  test('handles connect action', () => {
    const state = {connectRequest: {inProgress: false, error: new Error('AH')}}
    const action = {type: actionTypes.CONNECT}

    expect(reducer(state, action)).toEqual({
      connectRequest: {inProgress: true, error: null}
    })
  })

  test('handles connect response success', () => {
    const state = {
      connectRequest: {inProgress: true, error: null},
      isConnected: false
    }
    const action = {type: actionTypes.CONNECT_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      connectRequest: {inProgress: false, error: null},
      isConnected: true
    })
  })

  test('handles connectResponse failure', () => {
    const state = {
      connectRequest: {inProgress: true, error: null},
      isConnected: true
    }
    const action = {type: actionTypes.CONNECT_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      connectRequest: {inProgress: false, error: new Error('AH')},
      isConnected: false
    })
  })

  test('handles disconnect action', () => {
    const state = {
      disconnectRequest: {inProgress: false, error: new Error('AH')}
    }
    const action = {type: actionTypes.DISCONNECT}

    expect(reducer(state, action)).toEqual({
      disconnectRequest: {inProgress: true, error: null}
    })
  })

  test('handles disconnect response success', () => {
    const state = {
      disconnectRequest: {inProgress: true, error: null},
      isConnected: true,
      sessionName: 'session.py',
      protocolText: 'from opentrons import robot',
      protocolCommands: [{id: 'foo'}],
      protocolCommandsById: {foo: {id: 'foo'}},
      sessionErrors: [{message: 'AHH'}],
      sessionState: 'running'
    }
    const action = {type: actionTypes.DISCONNECT_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      disconnectRequest: {inProgress: false, error: null},
      isConnected: false,
      sessionName: '',
      protocolText: '',
      protocolCommands: [],
      protocolCommandsById: {},
      sessionErrors: [],
      sessionState: ''
    })
  })

  test('handles disconnectResponse failure', () => {
    const state = {
      disconnectRequest: {inProgress: true, error: null},
      isConnected: true,
      sessionName: 'session.py',
      protocolText: 'from opentrons import robot',
      protocolCommands: [{id: 'foo'}],
      protocolCommandsById: {foo: {id: 'foo'}},
      sessionErrors: [{message: 'AHH'}],
      sessionState: 'running'
    }
    const action = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: new Error('AH')
    }

    expect(reducer(state, action)).toEqual({
      disconnectRequest: {inProgress: false, error: new Error('AH')},
      isConnected: true,
      sessionName: 'session.py',
      protocolText: 'from opentrons import robot',
      protocolCommands: [{id: 'foo'}],
      protocolCommandsById: {foo: {id: 'foo'}},
      sessionErrors: [{message: 'AHH'}],
      sessionState: 'running'
    })
  })

  test('handles session with file', () => {
    const state = {
      sessionRequest: {inProgress: false, error: new Error('AH')},
      sessionName: ''
    }
    const action = {
      type: actionTypes.SESSION,
      payload: {file: {name: '/path/to/foo.py'}}
    }

    expect(reducer(state, action)).toEqual({
      sessionRequest: {inProgress: true, error: null},
      sessionName: '/path/to/foo.py'
    })
  })

  test('handles session response success with session', () => {
    const state = {
      sessionRequest: {inProgress: true, error: null},
      sessionName: 'foo.py',
      protocolText: '',
      protocolCommands: [],
      protocolCommandsById: {},
      sessionErrors: [],
      sessionState: ''
    }
    const action = {
      type: actionTypes.SESSION_RESPONSE,
      error: null,
      payload: {
        session: {
          sessionName: 'foo.py',
          protocolText: 'protocol woo',
          protocolCommands: [],
          protocolCommandsById: {},
          sessionErrors: [],
          sessionState: 'running'
        }
      }
    }

    expect(reducer(state, action)).toEqual({
      sessionRequest: {inProgress: false, error: null},
      sessionName: 'foo.py',
      protocolText: 'protocol woo',
      protocolCommands: [],
      protocolCommandsById: {},
      sessionErrors: [],
      sessionState: 'running'
    })
  })

  // TODO(mc): we may need to track which specific axes are homing
  test('handles home action', () => {
    const state = {homeRequest: {inProgress: false, error: new Error('AH')}}
    const action = {type: actionTypes.HOME}

    expect(reducer(state, action)).toEqual({
      homeRequest: {inProgress: true, error: null}
    })
  })

  test('handles homeResponse success', () => {
    const state = {homeRequest: {inProgress: true, error: null}}
    const action = {type: actionTypes.HOME_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      homeRequest: {inProgress: false, error: null}
    })
  })

  test('handles homeResponse failure', () => {
    const state = {homeRequest: {inProgress: true, error: null}}
    const action = {type: actionTypes.HOME_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      homeRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles run action', () => {
    const state = {
      runTime: now,
      runRequest: {inProgress: false, error: new Error('AH')}
    }
    const action = {type: actionTypes.RUN}

    expect(reducer(state, action)).toEqual({
      runRequest: {inProgress: true, error: null},
      runTime: 0
    })
  })

  test('handles runResponse success', () => {
    const state = {runRequest: {inProgress: true, error: null}}
    const action = {type: actionTypes.RUN_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      runRequest: {inProgress: false, error: null}
    })
  })

  test('handles runResponse failure', () => {
    const state = {runRequest: {inProgress: true, error: null}}
    const action = {type: actionTypes.RUN_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      runRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles tickRunTime', () => {
    const state = {runTime: 0}
    const action = {type: actionTypes.TICK_RUN_TIME}

    expect(reducer(state, action)).toEqual({runTime: now})
  })

  test('handles pause action', () => {
    const state = {pauseRequest: {inProgress: false, error: new Error('AHHH')}}
    const action = {type: actionTypes.PAUSE}

    expect(reducer(state, action)).toEqual({
      pauseRequest: {inProgress: true, error: null}
    })
  })

  test('handles pauseResponse success', () => {
    const state = {
      pauseRequest: {inProgress: true, error: null},
      isPaused: false
    }
    const action = {type: actionTypes.PAUSE_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      pauseRequest: {inProgress: false, error: null},
      isPaused: true
    })
  })

  test('handles pauseResponse failure', () => {
    const state = {
      pauseRequest: {inProgress: true, error: null},
      isPaused: false
    }
    const action = {type: actionTypes.PAUSE_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      pauseRequest: {inProgress: false, error: new Error('AH')},
      isPaused: false
    })
  })

  test('handles resume action', () => {
    const state = {resumeRequest: {inProgress: false, error: new Error('AHHH')}}
    const action = {type: actionTypes.RESUME}

    expect(reducer(state, action)).toEqual({
      resumeRequest: {inProgress: true, error: null}
    })
  })

  test('handles resumeResponse success', () => {
    const state = {
      resumeRequest: {inProgress: true, error: null},
      isPaused: true
    }
    const action = {type: actionTypes.RESUME_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      resumeRequest: {inProgress: false, error: null},
      isPaused: false
    })
  })

  test('handles resumeResponse failure', () => {
    const state = {
      resumeRequest: {inProgress: true, error: null},
      isPaused: true
    }
    const action = {type: actionTypes.RESUME_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      resumeRequest: {inProgress: false, error: new Error('AH')},
      isPaused: true
    })
  })

  test('handles cancel action', () => {
    const state = {cancelRequest: {inProgress: false, error: new Error('AHHH')}}
    const action = {type: actionTypes.CANCEL}

    expect(reducer(state, action)).toEqual({
      cancelRequest: {inProgress: true, error: null}
    })
  })

  test('handles cancelResponse success', () => {
    const state = {
      cancelRequest: {inProgress: true, error: null},
      isRunning: true,
      isPaused: true
    }
    const action = {type: actionTypes.CANCEL_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      cancelRequest: {inProgress: false, error: null},
      isRunning: false,
      isPaused: false
    })
  })

  test('handles cancelResponse failure', () => {
    const state = {
      cancelRequest: {inProgress: true, error: null},
      isRunning: true,
      isPaused: true
    }
    const action = {type: actionTypes.CANCEL_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      cancelRequest: {inProgress: false, error: new Error('AH')},
      isRunning: true,
      isPaused: true
    })
  })
})
