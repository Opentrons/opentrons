// @flow
// resources epics and instance state reducer
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'

import { healthReducer, healthEpic } from './health'
import { modulesReducer, modulesEpic } from './modules'
import { pipettesReducer, pipettesEpic } from './pipettes'
import { settingsReducer, settingsEpic } from './settings'

import type { RobotApiActionLike } from '../types'

export * from './health'
export * from './modules'
export * from './pipettes'
export * from './settings'

export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
  health: healthReducer,
  modules: modulesReducer,
  pipettes: pipettesReducer,
  settings: settingsReducer,
})

export const robotApiEpic = combineEpics(
  healthEpic,
  modulesEpic,
  pipettesEpic,
  settingsEpic
)
