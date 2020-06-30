// @flow
import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchLightsEpic } from './fetchLightsEpic'
import { updateLightsEpic } from './updateLightsEpic'
import { homeEpic } from './homeEpic'
import { moveEpic } from './moveEpic'

export const robotControlsEpic: Epic = combineEpics(
  fetchLightsEpic,
  updateLightsEpic,
  homeEpic,
  moveEpic
)
