// @flow
import { connectRouter } from 'connected-react-router'
import type { HashHistory } from 'history/createHashHistory'
import createHistory from 'history/createHashHistory'
import type { Reducer } from 'redux'
// interface state
import { combineReducers } from 'redux'

// app-wide alerts state
import { alertsReducer } from './alerts/reducer'
// robot buildroot update state
import { buildrootReducer } from './buildroot/reducer'
// calibration data state
import { calibrationReducer } from './calibration/reducer'
// config state
import { configReducer } from './config/reducer'
// custom labware state
import { customLabwareReducer } from './custom-labware/reducer'
// discovery state
import { discoveryReducer } from './discovery/reducer'
// oldest api state
import { superDeprecatedRobotApiReducer } from './http-api-client'
// modules state
import { modulesReducer } from './modules/reducer'
// networking state
import { networkingReducer } from './networking/reducer'
// pipettes state
import { pipettesReducer } from './pipettes/reducer'
// protocol state
import { protocolReducer } from './protocol/reducer'
// oldest robot api state
import { robotReducer } from './robot'
// robot administration state
import { robotAdminReducer } from './robot-admin/reducer'
// api state
import { robotApiReducer } from './robot-api/reducer'
// robot controls state
import { robotControlsReducer } from './robot-controls/reducer'
// robot settings state
import { robotSettingsReducer } from './robot-settings/reducer'
// robot  calibration and (eventually) protocol sessions state
import { sessionReducer } from './sessions/reducer'
// app shell state
import { shellReducer } from './shell/reducer'
// system info state
import { systemInfoReducer } from './system-info/reducer'
import type { Action, State } from './types'

export const history: HashHistory = createHistory()

export const rootReducer: Reducer<State, Action> = combineReducers<_, Action>({
  robot: robotReducer,
  superDeprecatedRobotApi: superDeprecatedRobotApiReducer,
  robotApi: robotApiReducer,
  robotAdmin: robotAdminReducer,
  robotControls: robotControlsReducer,
  robotSettings: robotSettingsReducer,
  buildroot: buildrootReducer,
  pipettes: pipettesReducer,
  modules: modulesReducer,
  networking: networkingReducer,
  config: configReducer,
  discovery: discoveryReducer,
  labware: customLabwareReducer,
  protocol: protocolReducer,
  shell: shellReducer,
  systemInfo: systemInfoReducer,
  alerts: alertsReducer,
  sessions: sessionReducer,
  calibration: calibrationReducer,
  router: connectRouter<_, Action>(history),
})
