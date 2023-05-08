import type { Action } from '../../types'
import { RobotSystemState } from './types'

const INITIAL_STATE: RobotSystemState = { robotServerStatus: 'inactive' }

export function robotSystemReducer(
  state: RobotSystemState = INITIAL_STATE,
  action: Action
): RobotSystemState {
  switch (action.type) {
    case 'shell:ROBOT_SERVER_SERVICE_STATUS': {
      return { ...state, robotServerStatus: action.payload }
    }
  }

  return state
}
