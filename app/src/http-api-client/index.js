// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {healthReducer, type HealthAction} from './health'

export const reducer = combineReducers({
  health: healthReducer
})

export {fetchHealth, selectHealth} from './health'

export type {
  RobotHealth,
  HealthSuccessAction,
  HealthFailureAction
} from './health'

export type Action =
  | HealthAction

export type State = $Call<typeof reducer>
