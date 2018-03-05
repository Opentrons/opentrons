// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {healthReducer, type HealthAction} from './health'
import {wifiReducer, type WifiAction} from './wifi'

export const reducer = combineReducers({
  health: healthReducer,
  wifi: wifiReducer
})

export type {
  ApiRequestError
} from './client'

export type {
  RobotHealth,
  HealthSuccessAction,
  HealthFailureAction
} from './health'

export type {
  WifiListResponse,
  WifiStatusResponse,
  WifiConfigureResponse,
  RobotWifiList,
  RobotWifiStatus,
  RobotWifiConfigure
} from './wifi'

export type State = $Call<typeof reducer>

export type Action =
  | HealthAction
  | WifiAction

export {fetchHealth, makeGetRobotHealth} from './health'

export {
  fetchWifiList,
  fetchWifiStatus,
  setConfigureWifiBody,
  clearConfigureWifiResponse,
  configureWifi,
  makeGetRobotWifiStatus,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure
} from './wifi'
