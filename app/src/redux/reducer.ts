import { combineReducers } from 'redux'

// app-wide alerts state
import { alertsReducer } from './alerts/reducer'
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
// local protocol run state
import { protocolRunReducer } from './protocol-runs/reducer'
// local protocol storage from file system state
import { protocolStorageReducer } from './protocol-storage/reducer'
// robot administration state
import { robotAdminReducer } from './robot-admin/reducer'
// api state
import { robotApiReducer } from './robot-api/reducer'
// robot auth state
import { robotAuthReducer } from './robot-auth/slice'
// robot settings state
import { robotSettingsReducer } from './robot-settings/reducer'
// robot robot update state
import { robotUpdateReducer } from './robot-update/reducer'
// robot  calibration and (eventually) protocol sessions state
import { sessionReducer } from './sessions/reducer'
// app shell state
import { shellReducer } from './shell/reducer'
// system info state
import { systemInfoReducer } from './system-info/reducer'

import type { Reducer } from 'redux'
import type { Action, State } from './types'

export const rootReducer: Reducer<State, Action> = (
  state: State | undefined,
  action: Action
): State => {
  const combinedReducer = combineReducers({
    robotAdmin: robotAdminReducer,
    robotApi: robotApiReducer,
    robotAuth: robotAuthReducer,
    robotSettings: robotSettingsReducer,
    robotUpdate: robotUpdateReducer,
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
    protocolRuns: protocolRunReducer,
  })

  return combinedReducer(state, action)
}
