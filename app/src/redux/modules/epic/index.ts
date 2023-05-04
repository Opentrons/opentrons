import type { Epic } from '../../types'
import { updateModuleEpic } from './updateModuleEpic'
import { combineEpics } from 'redux-observable'

export const modulesEpic: Epic = combineEpics<Epic>(updateModuleEpic)
