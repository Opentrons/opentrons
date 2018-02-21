// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {healthReducer, type HealthAction} from './health'
import {wifiReducer, type WifiAction} from './wifi'

export const reducer = combineReducers({
  health: healthReducer,
  wifi: wifiReducer
})

export {fetchHealth, selectHealth} from './health'

export {
  fetchWifiList,
  fetchWifiStatus,
  setConfigureWifiBody,
  configureWifi,
  selectWifi
} from './wifi'

export type {
  RobotHealth,
  HealthSuccessAction,
  HealthFailureAction
} from './health'

export type {
  RobotWifi
} from './wifi'

export type Action =
  | HealthAction
  | WifiAction

export type State = $Call<typeof reducer>
