import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { updateModuleEpic } from './updateModuleEpic'

export const modulesEpic: Epic = combineEpics<Epic>(updateModuleEpic)
