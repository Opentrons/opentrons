import createHistory from 'history/createHashHistory'
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

// api state
import { robotApiReducer } from './robot-api/reducer'

// robot administration state
import { robotAdminReducer } from './robot-admin/reducer'

// robot controls state
import { robotControlsReducer } from './robot-controls/reducer'

// robot settings state
import { robotSettingsReducer } from './robot-settings/reducer'

// robot buildroot update state
import { buildrootReducer } from './buildroot/reducer'

// pipettes state
import { pipettesReducer } from './pipettes/reducer'

// networking state
import { networkingReducer } from './networking/reducer'

// app shell state
import { shellReducer } from './shell/reducer'

// config state
import { configReducer } from './config/reducer'

// discovery state
import { discoveryReducer } from './discovery/reducer'

// custom labware state
import { customLabwareReducer } from './custom-labware/reducer'

// system info state
import { systemInfoReducer } from './system-info/reducer'

// app-wide alerts state
import { alertsReducer } from './alerts/reducer'

// robot  calibration and (eventually) protocol sessions state
import { sessionReducer } from './sessions/reducer'

// calibration data state
import { calibrationReducer } from './calibration/reducer'

// local protocol storage from file system state
import { protocolStorageReducer } from './protocol-storage/reducer'

import type { Reducer } from 'redux'
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
