import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { RobotUpdateState, RobotUpdateSession } from './types'

export const INITIAL_STATE: RobotUpdateState = {
  flex: {
    version: null,
    releaseNotes: null,
    downloadProgress: null,
    downloadError: null,
    force: false,
  },
  ot2: {
    version: null,
    releaseNotes: null,
    downloadProgress: null,
    downloadError: null,
    force: false,
  },
  session: null,
}

export const initialSession = (
  robotName: string | null,
  session: RobotUpdateSession | null
): RobotUpdateSession => ({
  robotName,
  fileInfo: session?.fileInfo || null,
  step: null,
  token: null,
  pathPrefix: null,
  stage: null,
  progress: null,
  error: null,
})

export const robotUpdateReducer: Reducer<RobotUpdateState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.ROBOTUPDATE_UPDATE_VERSION: {
      return {
        ...state,
        ...{
          [action.payload.target]: {
            ...state[action.payload.target],
            version: action.payload.version,
            force: action.payload?.force ?? false,
          },
        },
      }
    }

    case Constants.ROBOTUPDATE_UPDATE_INFO: {
      return {
        ...state,
        ...{
          [action.payload.target]: {
            ...state[action.payload.target],
            version: action.payload.version,
            releaseNotes: action.payload.releaseNotes,
          },
        },
      }
    }

    case Constants.ROBOTUPDATE_CHECKING_FOR_UPDATE: {
      const session = state.session as RobotUpdateSession
      const target = action.payload

      return {
        ...state,
        session: {
          ...session,
          step: Constants.DOWNLOAD_FILE,
          stage: Constants.WRITING,
          target,
        },
      }
    }

    case Constants.ROBOTUPDATE_DOWNLOAD_PROGRESS: {
      return {
        ...state,
        ...{
          [action.payload.target]: {
            ...state[action.payload.target],
            downloadProgress: action.payload.progress,
          },
        },
      }
    }

    case Constants.ROBOTUPDATE_DOWNLOAD_DONE: {
      if (!state.session) return state

      const { target, ...session } = state.session
      const isThisRobotDownloadDone =
        session?.step === Constants.DOWNLOAD_FILE && target === action.payload

      return isThisRobotDownloadDone
        ? {
            ...state,
            session: {
              ...session,
              stage: Constants.DONE,
            },
          }
        : state
    }

    case Constants.ROBOTUPDATE_DOWNLOAD_ERROR: {
      return {
        ...state,
        ...{
          [action.payload.target]: {
            ...state[action.payload.target],
            downloadError: action.payload.error,
          },
        },
      }
    }

    case Constants.ROBOTUPDATE_START_UPDATE: {
      return {
        ...state,
        session: initialSession(action.payload.robotName, state.session),
      }
    }

    case Constants.ROBOTUPDATE_CREATE_SESSION: {
      const { host } = action.payload
      const session = state.session || initialSession(host.name, null)

      return {
        ...state,
        session: {
          ...session,
          robotName: host.name,
          step: Constants.GET_TOKEN,
          stage: null,
        },
      }
    }

    case Constants.ROBOTUPDATE_CREATE_SESSION_SUCCESS: {
      const { host, pathPrefix, token } = action.payload
      const session = state.session || initialSession(host.name, null)

      return {
        ...state,
        session: { ...session, pathPrefix, token },
      }
    }

    case Constants.ROBOTUPDATE_STATUS: {
      if (!state.session) return state

      const { stage, progress, message } = action.payload
      const currentError = state.session?.error || null

      return {
        ...state,
        session: {
          ...state.session,
          stage,
          progress: typeof progress === 'number' ? progress : null,
          error: stage === Constants.ERROR ? message : currentError,
        },
      }
    }

    case Constants.ROBOTUPDATE_FILE_INFO: {
      return state.session
        ? {
            ...state,
            session: { ...state.session, fileInfo: action.payload },
          }
        : state
    }

    case Constants.ROBOTUPDATE_START_PREMIGRATION: {
      return state.session
        ? {
            ...state,
            session: { ...state.session, step: Constants.PREMIGRATION },
          }
        : state
    }

    case Constants.ROBOTUPDATE_PREMIGRATION_DONE: {
      return state.session
        ? {
            ...state,
            session: { ...state.session, step: Constants.PREMIGRATION_RESTART },
          }
        : state
    }

    case Constants.ROBOTUPDATE_UPLOAD_FILE: {
      return state.session
        ? {
            ...state,
            session: { ...state.session, step: Constants.UPLOAD_FILE },
          }
        : state
    }

    case Constants.ROBOTUPDATE_FILE_UPLOAD_DONE: {
      return state.session
        ? {
            ...state,
            session: { ...state.session, step: Constants.PROCESS_FILE },
          }
        : state
    }

    case Constants.ROBOTUPDATE_SET_SESSION_STEP: {
      return state.session
        ? { ...state, session: { ...state.session, step: action.payload } }
        : state
    }

    case Constants.ROBOTUPDATE_CLEAR_SESSION: {
      return { ...state, session: null }
    }

    case Constants.ROBOTUPDATE_PREMIGRATION_ERROR:
    case Constants.ROBOTUPDATE_UNEXPECTED_ERROR: {
      return state.session
        ? {
            ...state,
            session: { ...state.session, error: action.payload.message },
          }
        : state
    }
    case Constants.ROBOTUPDATE_FILE_UPLOAD_PROGRESS: {
      return state.session
        ? {
            ...state,
            session: {
              ...state.session,
              progress: Math.round(action.payload * 100),
            },
          }
        : state
    }
  }

  return state
}
