// session reducer tests
import { robotReducer as reducer, actionTypes } from '../'

import type { RobotState } from '../reducer'
import type { Action } from '../../types'

describe('robot reducer - session', () => {
  const now = Date.now()
  const _nowFn = Date.now

  // patch Date.now with a mock
  beforeAll(() => (Date.now = () => now))
  afterAll(() => (Date.now = _nowFn))

  it('initial state', () => {
    const state = reducer(undefined, {} as any)

    expect(state.session).toEqual({
      // loading a protocol
      sessionRequest: { inProgress: false, error: null },
      state: '',
      statusInfo: {
        message: null,
        userMessage: null,
        changedAt: null,
        estimatedDuration: null,
      },
      doorState: null,
      blocked: false,
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
      startTime: null,
      apiLevel: null,
    })
  })

  it('handles CONNECT_RESPONSE success', () => {
    const expected = { capabilities: ['create'] }
    const state: RobotState = { session: { capabilities: [] } } as any
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { sessionCapabilities: ['create'] } as any,
    }

    expect(reducer(state, action).session).toEqual(expected)
  })

  it('handles CONNECT_RESPONSE failure', () => {
    const expected = { capabilities: ['create'] }
    const state: RobotState = { session: { capabilities: ['create'] } } as any
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: new Error('AH'), sessionCapabilities: [] },
    }

    expect(reducer(state, action).session).toEqual(expected)
  })

  it('handles DISCONNECT_RESPONSE success', () => {
    const expected = reducer(undefined, {} as any).session
    const state: RobotState = { session: { dummy: 'state' } } as any
    const action: Action = { type: 'robot:DISCONNECT_RESPONSE', payload: {} }

    expect(reducer(state, action).session).toEqual(expected)
  })

  it('handles protocol:UPLOAD action', () => {
    const initialState = reducer(undefined, {} as any).session
    const state: RobotState = {
      session: {
        capabilities: ['create'],
        sessionRequest: { inProgress: false, error: new Error('AH') },
        startTime: 40,
      },
    } as any
    const action: Action = {
      type: 'protocol:UPLOAD',
      payload: {} as any,
      meta: {} as any,
    }

    expect(reducer(state, action).session).toEqual({
      ...initialState,
      capabilities: ['create'],
      sessionRequest: { inProgress: true, error: null },
    })
  })

  it('handles robot:REFRESH_SESSION action', () => {
    const state: RobotState = {
      session: {
        sessionRequest: { inProgress: false, error: null },
        startTime: 40,
      },
    } as any
    const action: Action = { type: 'robot:REFRESH_SESSION', meta: {} as any }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: { inProgress: true, error: null },
      startTime: null,
    })
  })

  it('handles SESSION_RESPONSE', () => {
    const state: RobotState = {
      session: {
        sessionRequest: { inProgress: true, error: null },
      },
    } as any
    const action: Action = {
      type: 'robot:SESSION_RESPONSE',
      payload: {
        name: '/path/to/foo.py',
        protocolText: 'protocol woo',
        state: 'running',
        errors: [],
        protocolCommands: [],
        protocolCommandsById: {},
      } as any,
      meta: {} as any,
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
    const state: RobotState = {
      session: {
        sessionRequest: { inProgress: true, error: null },
      },
    } as any
    const action: Action = {
      type: 'robot:SESSION_ERROR',
      payload: { error: new Error('AH') },
      meta: {} as any,
    }

    expect(reducer(state, action).session).toEqual({
      sessionRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles SESSION_UPDATE action', () => {
    const state: RobotState = {
      session: {
        state: 'loaded',
        startTime: null,
        protocolCommands: [0, 1, 2],
        protocolCommandsById: {
          0: { id: 0, handledAt: 2 },
        },
      },
    } as any
    const action: Action = {
      type: 'robot:SESSION_UPDATE',
      payload: {
        state: 'running',
        startTime: 1,
        lastCommand: { id: 1, handledAt: 3 },
      } as any,
      meta: {
        now: 6,
      },
    }

    expect(reducer(state, action).session).toEqual({
      state: 'running',
      startTime: 1,
      protocolCommands: [0, 1, 2],
      protocolCommandsById: {
        0: { id: 0, handledAt: 2 },
        1: { id: 1, handledAt: 3 },
      },
    })
  })

  it('handles RUN action', () => {
    const state: RobotState = {
      session: {
        runRequest: { inProgress: false, error: new Error('AH') },
      },
    } as any
    const action: Action = { type: actionTypes.RUN } as any

    expect(reducer(state, action).session).toEqual({
      runRequest: { inProgress: true, error: null },
    })
  })

  it('handles RUN_RESPONSE success', () => {
    const state: RobotState = {
      session: { runRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.RUN_RESPONSE,
      error: false,
    } as any

    expect(reducer(state, action).session).toEqual({
      runRequest: { inProgress: false, error: null },
    })
  })

  it('handles RUN_RESPONSE failure', () => {
    const state: RobotState = {
      session: { runRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.RUN_RESPONSE,
      error: true,
      payload: new Error('AH'),
    } as any

    expect(reducer(state, action).session).toEqual({
      runRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles PAUSE action', () => {
    const state: RobotState = {
      session: {
        pauseRequest: { inProgress: false, error: new Error('AH') },
      },
    } as any
    const action: Action = { type: actionTypes.PAUSE } as any

    expect(reducer(state, action).session).toEqual({
      pauseRequest: { inProgress: true, error: null },
    })
  })

  it('handles PAUSE_RESPONSE success', () => {
    const state: RobotState = {
      session: { pauseRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.PAUSE_RESPONSE,
      error: false,
    } as any

    expect(reducer(state, action).session).toEqual({
      pauseRequest: { inProgress: false, error: null },
    })
  })

  it('handles PAUSE_RESPONSE failure', () => {
    const state: RobotState = {
      session: { pauseRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.PAUSE_RESPONSE,
      payload: new Error('AH'),
      error: true,
    } as any

    expect(reducer(state, action).session).toEqual({
      pauseRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles RESUME action', () => {
    const state: RobotState = {
      session: {
        resumeRequest: { inProgress: false, error: new Error('AH') },
      },
    } as any
    const action: Action = { type: actionTypes.RESUME } as any

    expect(reducer(state, action).session).toEqual({
      resumeRequest: { inProgress: true, error: null },
    })
  })

  it('handles RESUME_RESPONSE success', () => {
    const state: RobotState = {
      session: { resumeRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.RESUME_RESPONSE,
      error: false,
    } as any

    expect(reducer(state, action).session).toEqual({
      resumeRequest: { inProgress: false, error: null },
    })
  })

  it('handles RESUME_RESPONSE failure', () => {
    const state: RobotState = {
      session: { resumeRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.RESUME_RESPONSE,
      payload: new Error('AH'),
      error: true,
    } as any

    expect(reducer(state, action).session).toEqual({
      resumeRequest: { inProgress: false, error: new Error('AH') },
    })
  })

  it('handles CANCEL action', () => {
    const state: RobotState = {
      session: {
        cancelRequest: { inProgress: false, error: new Error('AH') },
      },
    } as any
    const action: Action = { type: actionTypes.CANCEL } as any

    expect(reducer(state, action).session).toEqual({
      cancelRequest: { inProgress: true, error: null },
    })
  })

  it('handles CANCEL_RESPONSE success', () => {
    const state: RobotState = {
      session: { cancelRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.CANCEL_RESPONSE,
      error: false,
    } as any

    expect(reducer(state, action).session).toEqual({
      cancelRequest: { inProgress: false, error: null },
    })
  })

  it('handles CANCEL_RESPONSE failure', () => {
    const state: RobotState = {
      session: { cancelRequest: { inProgress: true, error: null } },
    } as any
    const action: Action = {
      type: actionTypes.CANCEL_RESPONSE,
      payload: new Error('AH'),
      error: true,
    } as any

    expect(reducer(state, action).session).toEqual({
      cancelRequest: { inProgress: false, error: new Error('AH') },
    })
  })
})
