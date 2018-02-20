// @flow
// interface state
import {combineReducers} from 'redux'
import {routerReducer} from 'react-router-redux'

// ui state
import {NAME as INTERFACE_NAME, reducer as interfaceReducer} from './interface'

// robot state
import {NAME as ROBOT_NAME, reducer as robotReducer} from './robot'

// api state
import {reducer as httpApiReducer} from './http-api-client'

// analytics state
import {NAME as ANALYTICS_NAME, reducer as analyticsReducer} from './analytics'

export default combineReducers({
  [INTERFACE_NAME]: interfaceReducer,
  [ROBOT_NAME]: robotReducer,
  [ANALYTICS_NAME]: analyticsReducer,
  api: httpApiReducer,
  router: routerReducer
})
