import { combineEpics } from 'redux-observable'
import { updateModuleEpic } from './updateModuleEpic'

import type { Epic } from '../../types'

export const modulesEpic: Epic = combineEpics<Epic>(updateModuleEpic)
