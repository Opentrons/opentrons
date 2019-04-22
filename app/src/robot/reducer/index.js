// @flow
// robot reducer
// TODO(mc, 2017-10-05): Split into sub-reducers or different redux modules
import { combineReducers } from 'redux'

import connectionReducer from './connection'
import sessionReducer from './session'
import calibrationReducer from './calibration'

import type { Action } from '../../types'

export default combineReducers<_, Action>({
  connection: connectionReducer,
  session: sessionReducer,
  calibration: calibrationReducer,
})
