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
import { robotApiReducer, deprecatedRobotApiReducer } from './robot-api/reducer'

// robot administration state
import { robotAdminReducer } from './robot-admin/reducer'

// robot settings state
import { robotSettingsReducer } from './robot-settings/reducer'

// pipettes state
import { pipettesReducer } from './pipettes/reducer'

// app shell state
import { shellReducer } from './shell'

// config state
import { configReducer } from './config'

// discovery state
import { discoveryReducer } from './discovery/reducer'

// protocol state
import { protocolReducer } from './protocol'

// custom labware state
import { customLabwareReducer } from './custom-labware/reducer'

import type { Reducer } from 'redux'
import type { State, Action } from './types'

export const history = createHistory()

const rootReducer: Reducer<State, Action> = combineReducers<_, Action>({
  robot: robotReducer,
  superDeprecatedRobotApi: superDeprecatedRobotApiReducer,
  deprecatedRobotApi: deprecatedRobotApiReducer,
  robotApi: robotApiReducer,
  robotAdmin: robotAdminReducer,
  robotSettings: robotSettingsReducer,
  pipettes: pipettesReducer,
  config: configReducer,
  discovery: discoveryReducer,
  labware: customLabwareReducer,
  protocol: protocolReducer,
  shell: shellReducer,
  router: connectRouter<_, Action>(history),
})

export default rootReducer
