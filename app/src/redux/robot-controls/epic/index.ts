import type { Epic } from '../../types'
import { fetchLightsEpic } from './fetchLightsEpic'
import { homeEpic } from './homeEpic'
import { moveEpic } from './moveEpic'
import { updateLightsEpic } from './updateLightsEpic'
import { combineEpics } from 'redux-observable'

export const robotControlsEpic: Epic = combineEpics<Epic>(
  fetchLightsEpic,
  updateLightsEpic,
  homeEpic,
  moveEpic
)
