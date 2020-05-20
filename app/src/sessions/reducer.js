// @flow
import omit from 'lodash/omit'

import * as Constants from './constants'

import type { Action } from '../types'

import type { SessionState, PerRobotSessionState } from './types'

const INITIAL_STATE: SessionState = {}

const INITIAL_PER_ROBOT_STATE: PerRobotSessionState = {
  robotSessions: null,
}

export function robotSessionReducer(
  state: SessionState = INITIAL_STATE,
  action: Action
): SessionState {
  switch (action.type) {
    case Constants.CREATE_SESSION_SUCCESS:
    case Constants.FETCH_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionState.data.id]: {
              ...sessionState.data.attributes,
              id: sessionState.data.id,
            },
          },
        },
      }
    }

    case Constants.FETCH_ALL_SESSIONS_SUCCESS: {
      const { robotName, sessions } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      const sessionsById = sessions.reduce(
        (acc, s) => ({ ...acc, [s.id]: { ...s.attributes, id: s.id } }),
        {}
      )

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: sessionsById,
        },
      }
    }

    case Constants.CREATE_SESSION_COMMAND_SUCCESS: {
      const { robotName, sessionId, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE

      if (!sessionId) return state

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionId]: { ...sessionState.meta, id: sessionId },
          },
        },
      }
    }

    case Constants.DELETE_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...omit(robotState.robotSessions, sessionState.data.id),
          },
        },
      }
    }
  }

  return state
}
