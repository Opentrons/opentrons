// @flow
import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchModulesEpic } from './fetchModulesEpic'
import { pollModulesWhileConnectedEpic } from './pollModulesWhileConnectedEpic'
import { sendModuleCommandEpic } from './sendModuleCommandEpic'
import { updateModuleEpic } from './updateModuleEpic'

export const modulesEpic: Epic = combineEpics(
  fetchModulesEpic,
  sendModuleCommandEpic,
  updateModuleEpic,
  pollModulesWhileConnectedEpic
)
