// @flow
// interface state
import {combineReducers} from 'redux'
import {routerReducer} from 'react-router-redux'

// robot state
import {NAME as ROBOT_NAME, reducer as robotReducer} from './robot'

// api state
import {reducer as httpApiReducer} from './http-api-client'

// app shell state
import {shellReducer} from './shell'

// analytics state
import {NAME as ANALYTICS_NAME, reducer as analyticsReducer} from './analytics'

export default combineReducers({
  [ROBOT_NAME]: robotReducer,
  [ANALYTICS_NAME]: analyticsReducer,
  api: httpApiReducer,
  shell: shellReducer,
  router: routerReducer
})
