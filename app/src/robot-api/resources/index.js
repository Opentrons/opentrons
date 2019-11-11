// @flow
// resources epics and instance state reducer
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'

import { modulesReducer, modulesEpic } from './modules'
import { pipettesReducer, pipettesEpic } from './pipettes'
import { settingsReducer, settingsEpic } from './settings'

import type { RobotApiActionLike } from '../types'

export * from './modules'
export * from './pipettes'
export * from './settings'

export const resourcesReducer = combineReducers<_, RobotApiActionLike>({
  modules: modulesReducer,
  pipettes: pipettesReducer,
  settings: settingsReducer,
})

export const robotApiEpic = combineEpics(
  modulesEpic,
  pipettesEpic,
  settingsEpic
)
