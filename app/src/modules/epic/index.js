// @flow
import { combineEpics } from 'redux-observable'
import { fetchModulesEpic } from './fetchModulesEpic'
import { sendModuleCommandEpic } from './sendModuleCommandEpic'
import { updateModuleEpic } from './updateModuleEpic'
import { pollModulesWhileConnectedEpic } from './pollModulesWhileConnectedEpic'

import type { Epic } from '../../types'

export const modulesEpic: Epic = combineEpics(
  fetchModulesEpic,
  sendModuleCommandEpic,
  updateModuleEpic,
  pollModulesWhileConnectedEpic
)
