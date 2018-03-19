// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {healthReducer, type HealthAction} from './health'
import {healthCheckReducer, type HealthCheckAction} from './health-check'
import {serverReducer, type ServerAction} from './server'
import {wifiReducer, type WifiAction} from './wifi'

export const reducer = combineReducers({
  health: healthReducer,
  healthCheck: healthCheckReducer,
  server: serverReducer,
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
  | HealthCheckAction
  | ServerAction
  | WifiAction

export {
  fetchHealth,
  makeGetRobotHealth
} from './health'

export {
  startHealthCheck,
  stopHealthCheck,
  setHealthCheckId,
  clearHealthCheckId,
  resetHealthCheck,
  healthCheckMiddleware,
  makeGetHealthCheckOk
} from './health-check'

export {
  updateRobotServer,
  restartRobotServer
} from './server'

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
