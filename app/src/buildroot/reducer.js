// @flow
import type { Action } from '../types'
import type { BuildrootState, BuildrootUpdateSession } from './types'

import {
  passRobotApiRequestAction,
  passRobotApiResponseAction,
  passRobotApiErrorAction,
} from '../robot-api/deprecated'
import * as actions from './actions'

export const INITIAL_STATE: BuildrootState = {
  seen: false,
  version: null,
  info: null,
  downloadProgress: null,
  downloadError: null,
  session: null,
}

export const initialSession = (
  robotName: string,
  session: BuildrootUpdateSession | null
) => ({
  robotName,
  userFileInfo: session?.userFileInfo || null,
  step: null,
  token: null,
  pathPrefix: null,
  stage: null,
  progress: null,
  error: null,
})

export function buildrootReducer(
  state: BuildrootState = INITIAL_STATE,
  action: Action
): BuildrootState {
  switch (action.type) {
    case actions.BR_UPDATE_VERSION:
      return { ...state, version: action.payload }

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
        session: initialSession(action.payload.robotName, state.session),
      }

    case actions.BR_USER_FILE_INFO:
      return {
        ...state,
        session: { ...state.session, userFileInfo: action.payload },
      }

    case actions.BR_START_PREMIGRATION:
      return {
        ...state,
        session: { ...state.session, step: 'premigration' },
      }

    case actions.BR_PREMIGRATION_DONE:
      return {
        ...state,
        session: { ...state.session, step: 'premigrationRestart' },
      }

    case actions.BR_UPLOAD_FILE:
      return { ...state, session: { ...state.session, step: 'uploadFile' } }

    case actions.BR_FILE_UPLOAD_DONE:
      return { ...state, session: { ...state.session, step: 'processFile' } }

    case actions.BR_SET_SESSION_STEP:
      return { ...state, session: { ...state.session, step: action.payload } }

    case actions.BR_CLEAR_SESSION:
      return { ...state, session: null }

    case actions.BR_PREMIGRATION_ERROR:
    case actions.BR_UNEXPECTED_ERROR:
      return {
        ...state,
        session: { ...state.session, error: action.payload.message },
      }
  }

  // HTTP API responses are not strongly typed, so check them separately
  const apiRequest = passRobotApiRequestAction(action)
  const apiResponse = passRobotApiResponseAction(action)
  const apiError = passRobotApiErrorAction(action)

  if (apiRequest !== null) {
    if (apiRequest.meta.buildrootToken === true) {
      return { ...state, session: { ...state.session, step: 'getToken' } }
    }

    if (apiRequest.meta.buildrootCommit === true) {
      return { ...state, session: { ...state.session, step: 'commitUpdate' } }
    }

    if (apiRequest.meta.buildrootRestart === true) {
      return { ...state, session: { ...state.session, step: 'restart' } }
    }
  }

  if (apiResponse !== null) {
    if (
      apiResponse.meta.buildrootToken === true &&
      typeof apiResponse.meta.buildrootPrefix === 'string' &&
      typeof apiResponse.payload.body.token === 'string'
    ) {
      const { host } = apiResponse.payload

      return {
        ...state,
        session: {
          ...state.session,
          robotName: host.name,
          token: apiResponse.payload.body.token,
          pathPrefix: apiResponse.meta.buildrootPrefix,
        },
      }
    }

    if (
      apiResponse.meta.buildrootStatus === true &&
      typeof apiResponse.payload.body.stage === 'string'
    ) {
      const { stage, progress, message } = apiResponse.payload.body

      return {
        ...state,
        session: {
          ...state.session,
          stage,
          progress:
            typeof progress === 'number' ? Math.round(progress * 100) : null,
          error: stage === 'error' ? (message: string) : state.session?.error,
        },
      }
    }
  }

  if (apiError !== null) {
    if (
      apiError.meta.buildrootRetry === true ||
      apiError.meta.buildrootCommit === true ||
      apiError.meta.buildrootRestart === true
    ) {
      const { method, path, status, body } = apiError.payload
      const error: string =
        body?.message || `${method} ${path} failed with status ${status}`

      return { ...state, session: { ...state.session, error } }
    }
  }

  return state
}
