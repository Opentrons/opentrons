// @flow
// generic api reducer

import type {State, Action} from '../types'
import type {BaseRobot} from '../robot'
import type {ModulesState} from './modules'

type RobotApiState =
  & ModulesState

type ApiState = {[name: string]: ?RobotApiState}

export default function apiReducer (
  state: ApiState = {},
  action: Action
): ApiState {
  switch (action.type) {
    case 'api:REQUEST': {
      const {request} = action.payload
      const {name, path, stateByName, stateByPath} = getUpdateInfo(state, action)

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, request, inProgress: true, error: null}
        }
      }
    }

    case 'api:SUCCESS': {
      const {response} = action.payload
      const {name, path, stateByName, stateByPath} = getUpdateInfo(state, action)

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, response, inProgress: false, error: null}
        }
      }
    }

    case 'api:FAILURE': {
      const {error} = action.payload
      const {name, path, stateByName, stateByPath} = getUpdateInfo(state, action)

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, error, inProgress: false}
        }
      }
    }
  }

  return state
}

export function getRobotApiState (
  state: State,
  props: BaseRobot
): RobotApiState {
  return state.api.api[props.name] || {}
}

function getUpdateInfo (state: ApiState, action: *): * {
  const {path, robot: {name}} = action.payload
  const stateByName = state[name] || {}
  // $FlowFixMe: type RobotApiState properly
  const stateByPath = stateByName[path] || {}

  return {name, path, stateByName, stateByPath}
}
