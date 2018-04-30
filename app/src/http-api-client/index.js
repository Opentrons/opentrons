// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import {calibrationReducer, type CalibrationAction} from './calibration'
import {healthReducer, type HealthAction} from './health'
import {healthCheckReducer, type HealthCheckAction} from './health-check'
import {motorsReducer, type MotorsAction} from './motors'
import {pipettesReducer, type PipettesAction} from './pipettes'
import {robotReducer, type RobotAction} from './robot'
import {serverReducer, type ServerAction} from './server'
import {wifiReducer, type WifiAction} from './wifi'

export const reducer = combineReducers({
  calibration: calibrationReducer,
  health: healthReducer,
  healthCheck: healthCheckReducer,
  motors: motorsReducer,
  pipettes: pipettesReducer,
  robot: robotReducer,
  server: serverReducer,
  wifi: wifiReducer
})

export * from './types'

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
  RobotMoveState,
  RobotHome
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
  | CalibrationAction
  | HealthAction
  | HealthCheckAction
  | MotorsAction
  | PipettesAction
  | RobotAction
  | ServerAction
  | WifiAction

export {
  startDeckCalibration
} from './calibration'

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
  disengagePipetteMotors
} from './motors'

export {
  fetchPipettes,
  makeGetRobotPipettes
} from './pipettes'

export {
  home,
  moveToChangePipette,
  clearRobotMoveResponse,
  makeGetRobotMove,
  makeGetRobotHome
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
