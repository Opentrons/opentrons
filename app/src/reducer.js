// @flow
import createHistory from 'history/createHashHistory'
import { connectRouter } from 'connected-react-router'

// interface state
import { combineReducers } from 'redux'

// oldest robot api state
import { robotReducer } from './robot'

// oldest api state
import { superDeprecatedRobotApiReducer } from './http-api-client'

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

// modules state
import { modulesReducer } from './modules/reducer'

// networking state
import { networkingReducer } from './networking/reducer'

// app shell state
import { shellReducer } from './shell/reducer'

// config state
import { configReducer } from './config/reducer'

// discovery state
import { discoveryReducer } from './discovery/reducer'

// protocol state
import { protocolReducer } from './protocol/reducer'

// custom labware state
import { customLabwareReducer } from './custom-labware/reducer'

import type { Reducer } from 'redux'
import type { State, Action } from './types'

export const history = createHistory()

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
  router: connectRouter<_, Action>(history),
})
