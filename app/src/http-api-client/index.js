// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {healthReducer, type HealthAction} from './health'
import {healthCheckReducer, type HealthCheckAction} from './health-check'
import {pipettesReducer, type PipettesAction} from './pipettes'
import {robotReducer, type RobotAction} from './robot'
import {serverReducer, type ServerAction} from './server'
import {wifiReducer, type WifiAction} from './wifi'

export const reducer = combineReducers({
  health: healthReducer,
  healthCheck: healthCheckReducer,
  pipettes: pipettesReducer,
  robot: robotReducer,
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
  Pipette,
  PipettesResponse,
  RobotPipettes
} from './pipettes'

export type {
  RobotMoveState
} from './robot'

export type {
  RobotServerUpdate,
  RobotServerRestart
} from './server'

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
  | PipettesAction
  | RobotAction
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
  fetchPipettes,
  makeGetRobotPipettes
} from './pipettes'

export {
  moveToChangePipette,
  makeGetRobotMove,
  clearRobotMoveResponse
} from './robot'

export {
  updateRobotServer,
  restartRobotServer,
  makeGetAvailableRobotUpdate,
  makeGetRobotUpdateRequest,
  makeGetRobotRestartRequest,
  getAnyRobotUpdateAvailable
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
