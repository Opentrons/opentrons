// @flow
// interface state
import {combineReducers} from 'redux'
import {routerReducer} from 'react-router-redux'

// robot state
import {reducer as robotReducer} from './robot'

// api state
import {reducer as httpApiReducer} from './http-api-client'

// health check state
import {healthCheckReducer} from './health-check'

// app shell state
import {shellReducer} from './shell'

// config state
import {configReducer} from './config'

// discovery state
import {discoveryReducer} from './discovery'

export default combineReducers({
  robot: robotReducer,
  api: httpApiReducer,
  config: configReducer,
  discovery: discoveryReducer,
  healthCheck: healthCheckReducer,
  shell: shellReducer,
  router: routerReducer,
})
