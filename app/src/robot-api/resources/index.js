// @flow
// resources epics and instance state reducer
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'

import { healthReducer, healthEpic } from './health'
import { modulesReducer, modulesEpic } from './modules'
import { settingsReducer, settingsEpic } from './settings'

import type { RobotApiActionLike } from '../types'

export * from './health'
export * from './modules'
export * from './settings'

export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
  health: healthReducer,
  modules: modulesReducer,
  settings: settingsReducer,
})

export const robotApiEpic = combineEpics(healthEpic, modulesEpic, settingsEpic)
