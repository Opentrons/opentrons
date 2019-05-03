// @flow
// resources epics and instance state reducer
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'
import { healthReducer, healthEpic } from './health'
import { modulesReducer, modulesEpic } from './modules'

import type { RobotApiActionLike } from '../types'

export * from './health'
export * from './modules'

export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
  health: healthReducer,
  modules: modulesReducer,
})

export const robotApiEpic = combineEpics(healthEpic, modulesEpic)
