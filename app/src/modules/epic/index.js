// @flow
import { combineEpics } from 'redux-observable'
import type { Epic } from '../../types'
import { fetchModulesEpic } from './fetchModulesEpic'
import { sendModuleCommandEpic } from './sendModuleCommandEpic'
import { updateModuleEpic } from './updateModuleEpic'
import { pollModulesWhileConnectedEpic } from './pollModulesWhileConnectedEpic'

export const modulesEpic: Epic = combineEpics(
  fetchModulesEpic,
  sendModuleCommandEpic,
  updateModuleEpic,
  pollModulesWhileConnectedEpic
)
