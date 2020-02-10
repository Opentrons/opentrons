// @flow
// api request state reducer
// tracks requests by ID
import omit from 'lodash/omit'
import { PENDING, SUCCESS, FAILURE, DISMISS_REQUEST } from './constants'

import type { Action } from '../types'
import type { RobotApiState } from './types'

export function robotApiReducer(
  state: RobotApiState = {},
  action: Action
): RobotApiState {
  if (action.type === DISMISS_REQUEST) {
    return omit(state, action.payload.requestId)
  }

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
