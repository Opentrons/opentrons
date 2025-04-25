import { combineEpics } from 'redux-observable'

import { fetchLightsEpic } from './fetchLightsEpic'
import { homeEpic } from './homeEpic'
import { moveEpic } from './moveEpic'
import { updateLightsEpic } from './updateLightsEpic'

import type { Epic } from '../../types'

export const robotControlsEpic: Epic = combineEpics<Epic>(
  fetchLightsEpic,
  updateLightsEpic,
  homeEpic,
  moveEpic
)
