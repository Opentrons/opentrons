// @flow
// TODO(mc, 2019-11-12): DEPRECATED; do not add to this file nor directory
// resources epics and instance state reducer
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'

import { modulesReducer, modulesEpic } from './modules'

import type { RobotApiActionLike } from '../types'

export * from './modules'

export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
  modules: modulesReducer,
})

export const robotApiEpic = combineEpics(modulesEpic)
