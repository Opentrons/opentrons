// @flow
// api request state reducer
// tracks requests by ID
// TODO(mc, 2020-03-05): caution! type checking in this file appears to
// be fairly broken; make sure you have unit tests in place when changing

import omit from 'lodash/omit'

import type { Action } from '../types'
import { DISMISS_REQUEST, FAILURE, PENDING, SUCCESS } from './constants'
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
