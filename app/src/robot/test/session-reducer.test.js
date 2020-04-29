// session reducer tests
import { robotReducer as reducer, actionTypes } from '../'

describe('robot reducer - session', () => {
  const now = Date.now()
  const _nowFn = Date.now

  // patch Date.now with a mock
  beforeAll(() => (Date.now = () => now))
  afterAll(() => (Date.now = _nowFn))

  it('initial state', () => {
    const state = reducer(undefined, {})

    expect(state.session).toEqual({
      // loading a protocol
      sessionRequest: { inProgress: false, error: null },
      state: '',
      stateInfo: {
        message: null,
        userMessage: null,
        changedAt: null,
        estimatedDuration: null,
      },
      errors: [],
      protocolCommands: [],
      protocolCommandsById: {},
      capabilities: [],

      // deck setup from protocol
      pipettesByMount: {},
      labwareBySlot: {},
      modulesBySlot: {},

      // running a protocol
      runRequest: { inProgress: false, error: null },
      pauseRequest: { inProgress: false, error: null },
      resumeRequest: { inProgress: false, error: null },
      cancelRequest: { inProgress: false, error: null },
      remoteTimeCompensation: null,
      startTime: null,
      runTime: 0,
      apiLevel: null,
    })
  })

  it('handles CONNECT_RESPONSE success', () => {
    const expected = { capabilities: ['create'] }
    const state = { session: { capabilities: [] } }
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { sessionCapabilities: ['create'] },
    }

    expect(reducer(state, action).session).toEqual(expected)
  })

  it('handles CONNECT_RESPONSE failure', () => {
    const expected = { capabilities: ['create'] }
    const state = { session: { capabilities: ['create'] } }
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: new Error('AH'), sessionCapabilities: [] },
    }

    expect(reducer(state, action).session).toEqual(expected)
  })

  it('handles DISCONNECT_RESPONSE success', () => {
    const expected = reducer(undefined, {}).session
    const state = { session: { dummy: 'state' } }
    const action = { type: 'robot:DISCONNECT_RESPONSE', payload: {} }

    expect(reducer(state, action).session).toEqual(expected)
  })

  it('handles protocol:UPLOAD action', () => {
    const initialState = reducer(undefined, {}).session
    const state = {
      session: {
        capabilities: ['create'],
        sessionRequest: { inProgress: false, error: new Error('AH') },
        startTime: 40,
        runTime: 42,
      },
    }
    const action = {
      type: 'protocol:UPLOAD',
      payload: {},
    }

    expect(reducer(state, action).session).toEqual({
      ...initialState,
      capabilities: ['create'],
      sessionRequest: { inProgress: true, error: null },
    })
  })

  it('handles robot:REFRESH_SESSION action', () => {
    const state = {
      session: {
        sessionRequest: { inProgress: false, error: null },
        startTime: 40,
        runTime: 42,
      },
    }
    const action = { type: 'robot:REFRESH_SESSION' }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: { inProgress: true, error: null },
      remoteTimeCompensation: null,
      startTime: null,
      runTime: 0,
    })
  })

  it('handles SESSION_RESPONSE', () => {
    const state = {
      session: {
        sessionRequest: { inProgress: true, error: null },
      },
    }
    const action = {
      type: 'robot:SESSION_RESPONSE',
      payload: {
        name: '/path/to/foo.py',
        protocolText: 'protocol woo',
        state: 'running',
        errors: [],
        protocolCommands: [],
        protocolCommandsById: {},
      },
    }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: { inProgress: false, error: null },
      state: 'running',
      errors: [],
      protocolCommands: [],
      protocolCommandsById: {},
    })
  })

  it('handles SESSION_ERROR', () => {
    const state = {
      session: {
        sessionRequest: { inProgress: true, error: null },
      },
    }
    const action = {
      type: 'robot:SESSION_ERROR',
      payload: { error: new Error('AH') },
    }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles SESSION_UPDATE action', () => {
    const state = {
      session: {
        state: 'loaded',
        startTime: null,
        remoteTimeCompensation: null,
        protocolCommands: [0, 1, 2],
        protocolCommandsById: {
          0: { id: 0, handledAt: 2 },
        },
      },
    }
    const action = {
      type: 'robot:SESSION_UPDATE',
      payload: {
        state: 'running',
        startTime: 1,
        lastCommand: { id: 1, handledAt: 3 },
      },
      meta: {
        now: 6,
      },
    }

    expect(reducer(state, action).session).toEqual({
      state: 'running',
      remoteTimeCompensation: 3,
      startTime: 1,
      protocolCommands: [0, 1, 2],
      protocolCommandsById: {
        0: { id: 0, handledAt: 2 },
        1: { id: 1, handledAt: 3 },
      },
    })
  })

  it('handles RUN action', () => {
    const state = {
      session: {
        runTime: now,
        runRequest: { inProgress: false, error: new Error('AH') },
      },
    }
    const action = { type: actionTypes.RUN }

    expect(reducer(state, action).session).toEqual({
      runRequest: { inProgress: true, error: null },
      runTime: 0,
    })
  })

  it('handles RUN_RESPONSE success', () => {
    const state = { session: { runRequest: { inProgress: true, error: null } } }
    const action = { type: actionTypes.RUN_RESPONSE, error: false }

    expect(reducer(state, action).session).toEqual({
      runRequest: { inProgress: false, error: null },
    })
  })

  it('handles RUN_RESPONSE failure', () => {
    const state = { session: { runRequest: { inProgress: true, error: null } } }
    const action = {
      type: actionTypes.RUN_RESPONSE,
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, action).session).toEqual({
      runRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles TICK_RUN_TIME', () => {
    const state = { session: { runTime: 0 } }
    const action = { type: actionTypes.TICK_RUN_TIME }

    expect(reducer(state, action).session).toEqual({ runTime: now })
  })

  it('handles PAUSE action', () => {
    const state = {
      session: {
        pauseRequest: { inProgress: false, error: new Error('AH') },
      },
    }
    const action = { type: actionTypes.PAUSE }

    expect(reducer(state, action).session).toEqual({
      pauseRequest: { inProgress: true, error: null },
    })
  })

  it('handles PAUSE_RESPONSE success', () => {
    const state = {
      session: { pauseRequest: { inProgress: true, error: null } },
    }
    const action = { type: actionTypes.PAUSE_RESPONSE, error: false }

    expect(reducer(state, action).session).toEqual({
      pauseRequest: { inProgress: false, error: null },
    })
  })

  it('handles PAUSE_RESPONSE failure', () => {
    const state = {
      session: { pauseRequest: { inProgress: true, error: null } },
    }
    const action = {
      type: actionTypes.PAUSE_RESPONSE,
      payload: new Error('AH'),
      error: true,
    }

    expect(reducer(state, action).session).toEqual({
      pauseRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles RESUME action', () => {
    const state = {
      session: {
        resumeRequest: { inProgress: false, error: new Error('AH') },
      },
    }
    const action = { type: actionTypes.RESUME }

    expect(reducer(state, action).session).toEqual({
      resumeRequest: { inProgress: true, error: null },
    })
  })

  it('handles RESUME_RESPONSE success', () => {
    const state = {
      session: { resumeRequest: { inProgress: true, error: null } },
    }
    const action = { type: actionTypes.RESUME_RESPONSE, error: false }

    expect(reducer(state, action).session).toEqual({
      resumeRequest: { inProgress: false, error: null },
    })
  })

  it('handles RESUME_RESPONSE failure', () => {
    const state = {
      session: { resumeRequest: { inProgress: true, error: null } },
    }
    const action = {
      type: actionTypes.RESUME_RESPONSE,
      payload: new Error('AH'),
      error: true,
    }

    expect(reducer(state, action).session).toEqual({
      resumeRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles CANCEL action', () => {
    const state = {
      session: {
        cancelRequest: { inProgress: false, error: new Error('AH') },
      },
    }
    const action = { type: actionTypes.CANCEL }

    expect(reducer(state, action).session).toEqual({
      cancelRequest: { inProgress: true, error: null },
    })
  })

  it('handles CANCEL_RESPONSE success', () => {
    const state = {
      session: { cancelRequest: { inProgress: true, error: null } },
    }
    const action = { type: actionTypes.CANCEL_RESPONSE, error: false }

    expect(reducer(state, action).session).toEqual({
      cancelRequest: { inProgress: false, error: null },
    })
  })

  it('handles CANCEL_RESPONSE failure', () => {
    const state = {
      session: { cancelRequest: { inProgress: true, error: null } },
    }
    const action = {
      type: actionTypes.CANCEL_RESPONSE,
      payload: new Error('AH'),
      error: true,
    }

    expect(reducer(state, action).session).toEqual({
      cancelRequest: { inProgress: false, error: new Error('AH') },
    })
  })
})
