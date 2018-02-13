// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {healthReducer, type HealthAction} from './health'

export type {HealthSuccessAction, HealthFailureAction} from './health'
export {fetchHealth, selectHealth} from './health'

export type Action =
  | HealthAction

export const reducer = combineReducers({
  health: healthReducer
})

export type State = $Call<typeof reducer>
