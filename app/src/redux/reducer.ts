import { connectRouter } from 'connected-react-router'
import createHistory from 'history/createHashHistory'
import { combineReducers } from 'redux'
import type { Reducer } from 'redux'

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
// networking state
import { networkingReducer } from './networking/reducer'
// pipettes state
import { pipettesReducer } from './pipettes/reducer'
// local protocol storage from file system state
import { protocolStorageReducer } from './protocol-storage/reducer'
// protocol state
import { protocolReducer } from './protocol/reducer'
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
import type { State, Action } from './types'

export const history = createHistory<any>()

export const rootReducer: Reducer<State, Action> = combineReducers<
  State,
  Action
>({
  robotApi: robotApiReducer,
  robotAdmin: robotAdminReducer,
  robotControls: robotControlsReducer,
  robotSettings: robotSettingsReducer,
  buildroot: buildrootReducer,
  pipettes: pipettesReducer,
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
  protocolStorage: protocolStorageReducer,
  router: connectRouter<State['router']>(history) as Reducer<
    State['router'],
    Action
  >,
})
