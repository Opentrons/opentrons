// @flow
import * as Fixtures from '../__fixtures__'
import { robotSessionReducer } from '../reducer'

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
        ...Fixtures.mockRobotSessionResponse,
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
          '1234': Fixtures.mockRobotSessionResponse.data.attributes,
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
        ...Fixtures.mockRobotSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionResponse.data.attributes,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionResponse.data.attributes,
          '1234': Fixtures.mockRobotSessionResponse.data.attributes,
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
        ...Fixtures.mockRobotSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {},
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          '1234': Fixtures.mockRobotSessionResponse.data.attributes,
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
        ...Fixtures.mockRobotSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionResponse.data.attributes,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          '1234': Fixtures.mockRobotSessionResponse.data.attributes,
          '4321': Fixtures.mockRobotSessionResponse.data.attributes,
        },
      },
    },
  },
  {
    name: 'handles sessions:CREATE_SESSION_COMMAND_SUCCESS',
    action: {
      type: 'sessions:CREATE_SESSION_COMMAND_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockRobotSessionUpdateResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          '1234': Fixtures.mockRobotSessionData,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          '1234': Fixtures.mockRobotSessionUpdateResponse.meta,
        },
      },
    },
  },
  {
    name: 'handles sessions:CREATE_SESSION_COMMAND_SUCCESS with existing',
    action: {
      type: 'sessions:CREATE_SESSION_COMMAND_SUCCESS',
      payload: {
        robotName: 'eggplant-parm',
        ...Fixtures.mockRobotSessionUpdateResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionData,
          '1234': Fixtures.mockRobotSessionData,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionData,
          '1234': Fixtures.mockRobotSessionUpdateResponse.meta,
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
        ...Fixtures.mockRobotSessionResponse,
      },
      meta: {},
    },
    state: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionData,
          '1234': Fixtures.mockRobotSessionData,
        },
      },
    },
    expected: {
      'eggplant-parm': {
        robotSessions: {
          '4321': Fixtures.mockRobotSessionData,
        },
      },
    },
  },
]

describe('robotSessionReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(robotSessionReducer(state, action)).toEqual(expected))
  })
})
