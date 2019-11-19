// @flow
// TODO(mc, 2019-11-12): DEPRECATED; do not add to this file nor directory
// resources epics and instance state reducer
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'

import { modulesReducer, modulesEpic } from './modules'
import { settingsReducer, settingsEpic } from './settings'

import type { RobotApiActionLike } from '../types'

export * from './modules'
export * from './settings'

export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
  modules: modulesReducer,
  settings: settingsReducer,
})

export const robotApiEpic = combineEpics(modulesEpic, settingsEpic)
