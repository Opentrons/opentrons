// @flow
import * as Fixtures from '../__fixtures__'
import { sessionReducer } from '../reducer'

import type { Action } from '../../types'
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
          [Fixtures.mockSessionId]:
            Fixtures.mockSessionResponse.data.attributes,
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
          existing_fake_session_id:
            Fixtures.mockSessionResponse.data.attributes,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id:
            Fixtures.mockSessionResponse.data.attributes,
          [Fixtures.mockSessionId]:
            Fixtures.mockSessionResponse.data.attributes,
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
          [Fixtures.mockSessionId]:
            Fixtures.mockSessionResponse.data.attributes,
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
          existing_fake_session_id:
            Fixtures.mockSessionResponse.data.attributes,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          [Fixtures.mockSessionId]:
            Fixtures.mockSessionResponse.data.attributes,
          existing_fake_session_id:
            Fixtures.mockSessionResponse.data.attributes,
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
            ...Fixtures.mockSessionAttributes,
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
          existing_fake_session_id: Fixtures.mockSessionAttributes,
          [Fixtures.mockSessionId]: Fixtures.mockSessionAttributes,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          existing_fake_session_id: Fixtures.mockSessionAttributes,
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
