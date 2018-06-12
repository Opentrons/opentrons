// session reducer tests
import {reducer, actionTypes} from '../'

describe('robot reducer - session', () => {
  const now = Date.now()
  const _nowFn = Date.now

  // patch Date.now with a mock
  beforeAll(() => (Date.now = () => now))
  afterAll(() => (Date.now = _nowFn))

  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state.session).toEqual({
      // loading a protocol
      sessionRequest: {inProgress: false, error: null},
      name: '',
      state: '',
      errors: [],
      protocolText: '',
      protocolCommands: [],
      protocolCommandsById: {},

      // deck setup from protocol
      instrumentsByMount: {},
      labwareBySlot: {},

      // running a protocol
      runRequest: {inProgress: false, error: null},
      pauseRequest: {inProgress: false, error: null},
      resumeRequest: {inProgress: false, error: null},
      cancelRequest: {inProgress: false, error: null},
      startTime: null,
      runTime: 0
    })
  })

  test('handles DISCONNECT_RESPONSE success', () => {
    const expected = reducer(undefined, {}).session
    const state = {session: {dummy: 'state'}}
    const action = {type: 'robot:DISCONNECT_RESPONSE', payload: {}}

    expect(reducer(state, action).session).toEqual(expected)
  })

  test('handles DISCONNECT_RESPONSE failure', () => {
    const state = {session: {dummy: 'state'}}
    const action = {
      type: 'robot:DISCONNECT_RESPONSE',
      payload: {error: new Error('AH')}
    }

    expect(reducer(state, action).session).toEqual(state.session)
  })

  test('handles SESSION action', () => {
    const state = {
      session: {
        sessionRequest: {inProgress: false, error: new Error('AH')},
        name: '',
        startTime: 40,
        runTime: 42
      }
    }
    const action = {
      type: actionTypes.SESSION,
      payload: {file: {name: '/path/to/foo.py'}}
    }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: {inProgress: true, error: null},
      name: '/path/to/foo.py',
      startTime: null,
      runTime: 0
    })
  })

  test('handles robot:REFRESH_SESSION action', () => {
    const INITIAL_CALIBRATION_STATE = {
      deckPopulated: null,
      jogDistance: 0.1,

      // TODO(mc, 2018-01-22): combine these into subreducer
      probedByMount: {},
      tipOnByMount: {},

      confirmedBySlot: {},

      calibrationRequest: {type: '', inProgress: false, error: null}
    }

    const state = {
      session: {
        sessionRequest: {inProgress: false, error: null},
        startTime: 40,
        runTime: 42
      },
      calibration: {
        deckPopulated: true,
        jogDistance: 1,
        probedByMount: {
          left: true
        },
        confirmedBySlot: {
          9: true
        }
      }
    }
    const action = {type: 'robot:REFRESH_SESSION'}

    expect(reducer(state, action).session).toEqual({
      sessionRequest: {inProgress: true, error: null},
      startTime: null,
      runTime: 0
    })
    expect(reducer(state, action).calibration).toEqual(INITIAL_CALIBRATION_STATE)
  })

  test('handles SESSION_RESPONSE success', () => {
    const state = {
      session: {
        sessionRequest: {inProgress: true, error: null},
        name: '/path/to/foo.py'
      }
    }
    const action = {
      type: actionTypes.SESSION_RESPONSE,
      error: false,
      payload: {
        state: 'running',
        errors: [],
        protocolText: 'protocol woo',
        protocolCommands: [],
        protocolCommandsById: {}
      }
    }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: {inProgress: false, error: null},
      name: '/path/to/foo.py',
      state: 'running',
      errors: [],
      protocolText: 'protocol woo',
      protocolCommands: [],
      protocolCommandsById: {}
    })
  })

  test('handles SESSION_RESPONSE failure', () => {
    const state = {
      session: {
        sessionRequest: {inProgress: true, error: null},
        name: '/path/to/foo.py'
      }
    }
    const action = {
      type: actionTypes.SESSION_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: {inProgress: false, error: new Error('AH')},
      name: '/path/to/foo.py'
    })
  })

  test('handles SESSION_UPDATE action', () => {
    const state = {
      session: {
        state: 'loaded',
        startTime: null,
        protocolCommands: [0, 1, 2],
        protocolCommandsById: {
          0: {id: 0, handledAt: 2}
        }
      }
    }
    const action = {
      type: 'robot:SESSION_UPDATE',
      payload: {
        state: 'running',
        startTime: 1,
        lastCommand: {id: 1, handledAt: 3}
      }
    }

    expect(reducer(state, action).session).toEqual({
      state: 'running',
      startTime: 1,
      protocolCommands: [0, 1, 2],
      protocolCommandsById: {
        0: {id: 0, handledAt: 2},
        1: {id: 1, handledAt: 3}
      }
    })
  })

  test('handles RUN action', () => {
    const state = {
      session: {
        runTime: now,
        runRequest: {inProgress: false, error: new Error('AH')}
      }
    }
    const action = {type: actionTypes.RUN}

    expect(reducer(state, action).session).toEqual({
      runRequest: {inProgress: true, error: null},
      runTime: 0
    })
  })

  test('handles RUN_RESPONSE success', () => {
    const state = {session: {runRequest: {inProgress: true, error: null}}}
    const action = {type: actionTypes.RUN_RESPONSE, error: false}

    expect(reducer(state, action).session).toEqual({
      runRequest: {inProgress: false, error: null}
    })
  })

  test('handles RUN_RESPONSE failure', () => {
    const state = {session: {runRequest: {inProgress: true, error: null}}}
    const action = {
      type: actionTypes.RUN_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, action).session).toEqual({
      runRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles TICK_RUN_TIME', () => {
    const state = {session: {runTime: 0}}
    const action = {type: actionTypes.TICK_RUN_TIME}

    expect(reducer(state, action).session).toEqual({runTime: now})
  })

  test('handles PAUSE action', () => {
    const state = {
      session: {
        pauseRequest: {inProgress: false, error: new Error('AH')}
      }
    }
    const action = {type: actionTypes.PAUSE}

    expect(reducer(state, action).session).toEqual({
      pauseRequest: {inProgress: true, error: null}
    })
  })

  test('handles PAUSE_RESPONSE success', () => {
    const state = {session: {pauseRequest: {inProgress: true, error: null}}}
    const action = {type: actionTypes.PAUSE_RESPONSE, error: false}

    expect(reducer(state, action).session).toEqual({
      pauseRequest: {inProgress: false, error: null}
    })
  })

  test('handles PAUSE_RESPONSE failure', () => {
    const state = {session: {pauseRequest: {inProgress: true, error: null}}}
    const action = {
      type: actionTypes.PAUSE_RESPONSE,
      payload: new Error('AH'),
      error: true
    }

    expect(reducer(state, action).session).toEqual({
      pauseRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles RESUME action', () => {
    const state = {
      session: {
        resumeRequest: {inProgress: false, error: new Error('AH')}
      }
    }
    const action = {type: actionTypes.RESUME}

    expect(reducer(state, action).session).toEqual({
      resumeRequest: {inProgress: true, error: null}
    })
  })

  test('handles RESUME_RESPONSE success', () => {
    const state = {session: {resumeRequest: {inProgress: true, error: null}}}
    const action = {type: actionTypes.RESUME_RESPONSE, error: false}

    expect(reducer(state, action).session).toEqual({
      resumeRequest: {inProgress: false, error: null}
    })
  })

  test('handles RESUME_RESPONSE failure', () => {
    const state = {session: {resumeRequest: {inProgress: true, error: null}}}
    const action = {
      type: actionTypes.RESUME_RESPONSE,
      payload: new Error('AH'),
      error: true
    }

    expect(reducer(state, action).session).toEqual({
      resumeRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles CANCEL action', () => {
    const state = {
      session: {
        cancelRequest: {inProgress: false, error: new Error('AH')}
      }
    }
    const action = {type: actionTypes.CANCEL}

    expect(reducer(state, action).session).toEqual({
      cancelRequest: {inProgress: true, error: null}
    })
  })

  test('handles CANCEL_RESPONSE success', () => {
    const state = {session: {cancelRequest: {inProgress: true, error: null}}}
    const action = {type: actionTypes.CANCEL_RESPONSE, error: false}

    expect(reducer(state, action).session).toEqual({
      cancelRequest: {inProgress: false, error: null}
    })
  })

  test('handles CANCEL_RESPONSE failure', () => {
    const state = {session: {cancelRequest: {inProgress: true, error: null}}}
    const action = {
      type: actionTypes.CANCEL_RESPONSE,
      payload: new Error('AH'),
      error: true
    }

    expect(reducer(state, action).session).toEqual({
      cancelRequest: {inProgress: false, error: new Error('AH')}
    })
  })
})
