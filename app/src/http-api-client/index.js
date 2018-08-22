// @flow
// robot HTTP API client module
import {combineReducers} from 'redux'
import apiReducer from './reducer'
import {calibrationReducer, type CalibrationAction} from './calibration'
import {healthReducer, type HealthAction} from './health'
import type {ModulesAction} from './modules'
import {motorsReducer, type MotorsAction} from './motors'
import {pipettesReducer, type PipettesAction} from './pipettes'
import type {ResetAction} from './reset'
import {robotReducer, type RobotAction} from './robot'
import {serverReducer, type ServerAction} from './server'
import {settingsReducer, type SettingsAction} from './settings'
import {wifiReducer, type WifiAction} from './wifi'

export const reducer = combineReducers({
  calibration: calibrationReducer,
  health: healthReducer,
  motors: motorsReducer,
  pipettes: pipettesReducer,
  robot: robotReducer,
  server: serverReducer,
  settings: settingsReducer,
  wifi: wifiReducer,
  // TODO(mc, 2018-07-09): api subreducer will become the sole reducer
  api: apiReducer
})

export * from './types'

export type {
  ApiRequestAction,
  ApiSuccessAction,
  ApiFailureAction,
  ClearApiResponseAction
} from './actions'

export type {
  DeckCalStartState,
  DeckCalCommandState,
  JogAxis,
  JogDirection,
  JogStep,
  DeckCalPoint
} from './calibration'

export type {
  RobotHealth
} from './health'

export type {
  Pipette,
  PipettesResponse,
  RobotPipettes
} from './pipettes'

export type {
  RobotMove,
  RobotHome,
  RobotLights
} from './robot'

export type {
  RobotServerUpdate,
  RobotServerRestart,
  RobotServerUpdateIgnore
} from './server'

export type {
  Setting
} from './settings'

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
  | ModulesAction
  | MotorsAction
  | PipettesAction
  | ResetAction
  | RobotAction
  | ServerAction
  | SettingsAction
  | WifiAction

export {
  startDeckCalibration,
  deckCalibrationCommand,
  makeGetDeckCalibrationStartState,
  makeGetDeckCalibrationCommandState
} from './calibration'

export {
  fetchHealth,
  makeGetRobotHealth
} from './health'

export * from './modules'

export * from './reset'

export {
  disengagePipetteMotors
} from './motors'

export {
  fetchPipettes,
  makeGetRobotPipettes
} from './pipettes'

export {
  home,
  clearHomeResponse,
  moveRobotTo,
  clearMoveResponse,
  fetchRobotLights,
  setRobotLights,
  makeGetRobotMove,
  makeGetRobotHome,
  makeGetRobotLights
} from './robot'

export {
  updateRobotServer,
  restartRobotServer,
  makeGetAvailableRobotUpdate,
  makeGetRobotUpdateRequest,
  makeGetRobotRestartRequest,
  getAnyRobotUpdateAvailable,
  fetchHealthAndIgnored,
  fetchIgnoredUpdate,
  setIgnoredUpdate,
  makeGetRobotIgnoredUpdateRequest,
  clearRestartResponse
} from './server'

export {
  fetchSettings,
  setSettings,
  makeGetRobotSettings
} from './settings'

export {
  fetchWifiList,
  fetchWifiStatus,
  clearConfigureWifiResponse,
  configureWifi,
  makeGetRobotWifiStatus,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure
} from './wifi'
