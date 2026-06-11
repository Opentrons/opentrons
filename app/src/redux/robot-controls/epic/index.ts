import { combineEpics } from 'redux-observable'

import { homeEpic } from './homeEpic'
import { moveEpic } from './moveEpic'

import type { Epic } from '../../types'

export const robotControlsEpic: Epic = combineEpics<Epic>(homeEpic, moveEpic)
