import type { Action } from '../../types'
import type { RobotLogsState } from './types'

const INITIAL_STATE: RobotLogsState = { downloading: false }

export function robotLogsReducer(
  state: RobotLogsState = INITIAL_STATE,
  action: Action
): RobotLogsState {
  switch (action.type) {
    case 'shell:DOWNLOAD_LOGS': {
      return { ...state, downloading: true }
    }

    case 'shell:DOWNLOAD_LOGS_DONE': {
      return { ...state, downloading: false }
    }
  }

  return state
}
