// @flow
// api request state reducer
// tracks requests by ID

import { PENDING, SUCCESS, FAILURE } from './constants'

import type { Action } from '../types'
import type { RobotApiState } from './types'

export function robotApiReducer(
  state: RobotApiState = {},
  action: Action
): RobotApiState {
  const meta = action.meta ? action.meta : {}

  if (meta.requestId != null) {
    if (!meta.response) {
      return { ...state, [meta.requestId]: { status: PENDING } }
    }

    if (meta.response.ok) {
      return {
        ...state,
        [meta.requestId]: { status: SUCCESS, response: meta.response },
      }
    }

    if (meta.response.ok === false) {
      const error =
        action.payload && action.payload.error ? action.payload.error : {}

      return {
        ...state,
        [meta.requestId]: {
          status: FAILURE,
          response: meta.response,
          error,
        },
      }
    }
  }

  return state
}
