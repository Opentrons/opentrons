// @flow
import type { Action } from '../../types'
import type { BuildrootState } from './types'

import { passRobotApiResponseAction } from '../../robot-api'
import * as actions from './actions'

export const INITIAL_STATE: BuildrootState = {
  seen: false,
  info: null,
  downloadProgress: null,
  downloadError: null,
  session: null,
}

export function buildrootReducer(
  state: BuildrootState = INITIAL_STATE,
  action: Action
): BuildrootState {
  switch (action.type) {
    case actions.BR_UPDATE_INFO:
      return { ...state, info: action.payload }
    case actions.BR_SET_UPDATE_SEEN:
      return { ...state, seen: true }
    case actions.BR_DOWNLOAD_PROGRESS:
      return { ...state, downloadProgress: action.payload }
    case actions.BR_DOWNLOAD_ERROR:
      return { ...state, downloadError: action.payload }

    case actions.BR_START_UPDATE:
      return {
        ...state,
        session: {
          robotName: action.payload,
          triggerUpdate: false,
          token: null,
          pathPrefix: null,
        },
      }

    case actions.BR_PREMIGRATION_DONE:
      return {
        ...state,
        session: { ...state.session, triggerUpdate: true },
      }
  }

  const apiResponse = passRobotApiResponseAction(action)

  if (
    apiResponse !== null &&
    apiResponse.meta.buildrootToken === true &&
    typeof apiResponse.meta.buildrootPrefix === 'string' &&
    typeof apiResponse.payload.body.token === 'string'
  ) {
    const { host } = apiResponse.payload

    return {
      ...state,
      session: {
        robotName: host.name,
        triggerUpdate: false,
        token: apiResponse.payload.body.token,
        pathPrefix: apiResponse.meta.buildrootPrefix,
      },
    }
  }

  return state
}
