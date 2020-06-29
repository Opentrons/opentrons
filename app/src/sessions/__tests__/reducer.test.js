// @flow
import * as Fixtures from '../__fixtures__'
import { mockV2ErrorResponse } from '../../robot-api/__fixtures__'
import type { Action } from '../../types'
import * as Actions from '../actions'
import { sessionReducer } from '../reducer'
import type { SessionState } from '../types'

type ReducerSpec = {|
  name: string,
  state: SessionState,
  action: Action,
  expected: SessionState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles sessions:CREATE_SESSION_SUCCESS',
    action: {
      type: 'sessions:CREATE_SESSION_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {},
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: Fixtures.mockSessionId,
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:CREATE_SESSION_SUCCESS with existing',
    action: {
      type: 'sessions:CREATE_SESSION_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: 'existing_fake_session_id',
          },
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: Fixtures.mockSessionId,
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:FETCH_SESSION_SUCCESS',
    action: {
      type: 'sessions:FETCH_SESSION_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {},
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: Fixtures.mockSessionId,
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:FETCH_SESSION_SUCCESS with existing',
    action: {
      type: 'sessions:FETCH_SESSION_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: Fixtures.mockSessionId,
          },
          existing_fake_session_id: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:CREATE_SESSION_COMMAND_SUCCESS with existing',
    action: Actions.createSessionCommandSuccess(
      'eggplant-parm',
      Fixtures.mockSessionId,
      Fixtures.mockSessionResponse,
      {}
    ),
    state: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: Fixtures.mockSessionId,
          },
          existing_fake_session_id: {
            ...Fixtures.mockSessionResponse.data.attributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:FETCH_ALL_SESSIONS_SUCCESS with none existing',
    action: {
      type: 'sessions:FETCH_ALL_SESSIONS_SUCCESS',
      payload: {
        robotName: 'rock-lobster',
        sessions: Fixtures.mockMultiSessionResponse.data,
      },
      meta: {},
    },
    state: {
      'rock-lobster': {},
    },
    expected: {
      'rock-lobster': {
        robotSessions: {
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockMultiSessionResponse.data[0].attributes,
            id: Fixtures.mockSessionId,
          },
          [Fixtures.mockOtherSessionId]: {
            ...Fixtures.mockMultiSessionResponse.data[1].attributes,
            id: Fixtures.mockOtherSessionId,
          },
        },
      },
    },
  },
  {
    name:
      'handles sessions:FETCH_ALL_SESSIONS_SUCCESS overwriting existing sessions',
    action: {
      type: 'sessions:FETCH_ALL_SESSIONS_SUCCESS',
      payload: {
        robotName: 'rock-lobster',
        sessions: Fixtures.mockMultiSessionResponse.data,
      },
      meta: {},
    },
    state: {
      'rock-lobster': {
        robotSessions: {
          fake_stale_session_id: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: 'fake_stale_session_id',
          },
        },
      },
    },
    expected: {
      'rock-lobster': {
        robotSessions: {
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockMultiSessionResponse.data[0].attributes,
            id: Fixtures.mockSessionId,
          },
          [Fixtures.mockOtherSessionId]: {
            ...Fixtures.mockMultiSessionResponse.data[1].attributes,
            id: Fixtures.mockOtherSessionId,
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:DELETE_SESSION_SUCCESS',
    action: {
      type: 'sessions:DELETE_SESSION_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: 'existing_fake_session_id',
          },
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: Fixtures.mockSessionId,
          },
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:DELETE_SESSION_FAILURE',
    action: {
      type: 'sessions:DELETE_SESSION_FAILURE',
      payload: {
        robotName: 'frumious-bandersnatch',
        sessionId: Fixtures.mockSessionId,
        error: mockV2ErrorResponse,
      },
      meta: {
        response: { ...Fixtures.mockDeleteSessionFailureMeta, status: 404 },
      },
    },
    state: {
      'frumious-bandersnatch': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockTipLengthCalibrationSessionAttributes,
            id: 'existing_fake_session_id',
          },
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockTipLengthCalibrationSessionAttributes,
            id: Fixtures.mockSessionId,
          },
        },
      },
    },
    expected: {
      'frumious-bandersnatch': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockTipLengthCalibrationSessionAttributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
  },
  {
    name: 'handles sessions:FETCH_SESSION_FAILURE',
    action: {
      type: 'sessions:FETCH_SESSION_FAILURE',
      payload: {
        robotName: 'detestable-moss',
        sessionId: Fixtures.mockSessionId,
        error: mockV2ErrorResponse,
      },
      meta: {
        response: { ...Fixtures.mockFetchSessionFailureMeta, status: 404 },
      },
    },
    state: {
      'detestable-moss': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: 'existing_fake_session_id',
          },
          [Fixtures.mockSessionId]: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: Fixtures.mockSessionId,
          },
        },
      },
    },
    expected: {
      'detestable-moss': {
        robotSessions: {
          existing_fake_session_id: {
            ...Fixtures.mockCalibrationCheckSessionAttributes,
            id: 'existing_fake_session_id',
          },
        },
      },
    },
  },
]

describe('robotSessionReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(sessionReducer(state, action)).toEqual(expected))
  })
})
