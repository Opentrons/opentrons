// @flow
import createHistory from 'history/createHashHistory'
import { connectRouter } from 'connected-react-router'

// interface state
import { combineReducers } from 'redux'

// oldest robot api state
import { reducer as robotReducer } from './robot'

// old api state
import { reducer as apiReducer } from './http-api-client'

// api state
import { robotApiReducer } from './robot-api'

// app shell state
import { shellReducer } from './shell'

// config state
import { configReducer } from './config'

// discovery state
import { discoveryReducer } from './discovery'

// protocol state
import { protocolReducer } from './protocol'

import type { Action } from './types'

export const history = createHistory()

export default combineReducers<_, Action>({
  robot: robotReducer,
  api: apiReducer,
  robotApi: robotApiReducer,
  config: configReducer,
  discovery: discoveryReducer,
  protocol: protocolReducer,
  shell: shellReducer,
  router: connectRouter<_, Action>(history),
})
