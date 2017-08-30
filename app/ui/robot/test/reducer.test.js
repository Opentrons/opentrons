// robot reducer test

import {reducer, actionTypes} from '../'

describe('robot reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      connectRequest: {inProgress: false, error: null},
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
      isRunning: false,
      isPaused: false
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

  test('handles session without file', () => {
    const state = {sessionRequest: {inProgress: false, error: new Error('AH')}}
    const action = {type: actionTypes.SESSION}

    expect(reducer(state, action)).toEqual({
      sessionRequest: {inProgress: true, error: null}
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
      sessionName: 'foo.py'
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
        sessionName: 'foo.py',
        protocolText: 'protocol woo',
        protocolCommands: [],
        protocolCommandsById: {},
        sessionErrors: [],
        sessionState: 'running'
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
    const state = {runRequest: {inProgress: false, error: new Error('AH')}}
    const action = {type: actionTypes.RUN}

    expect(reducer(state, action)).toEqual({
      runRequest: {inProgress: true, error: null},
      // TODO(mc): for now, naively assume that if a run request is dispatched
      // the robot is running
      isRunning: true,
      currentCommand: -1
    })
  })

  test('handles runResponse success', () => {
    const state = {isRunning: true, runRequest: {inProgress: true, error: null}}
    const action = {type: actionTypes.RUN_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      runRequest: {inProgress: false, error: null},
      isRunning: false
    })
  })

  test('handles runResponse failure', () => {
    const state = {isRunning: true, runRequest: {inProgress: true, error: null}}
    const action = {type: actionTypes.RUN_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      runRequest: {inProgress: false, error: new Error('AH')},
      isRunning: false
    })
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

  test('handles setCommands', () => {
    const state = {commands: [], currentCommand: 42}
    const action = {
      type: actionTypes.SET_COMMANDS,
      payload: {commands: ['foo', 'bar', 'baz']}
    }

    expect(reducer(state, action)).toEqual({
      commands: ['foo', 'bar', 'baz'],
      currentCommand: -1
    })
  })

  test('handles tickCurrentCommand', () => {
    const state = {currentCommand: 3}
    const action = {type: actionTypes.TICK_CURRENT_COMMAND}

    expect(reducer(state, action)).toEqual({currentCommand: 4})
  })
})
