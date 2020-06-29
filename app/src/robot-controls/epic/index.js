// @flow
import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchLightsEpic } from './fetchLightsEpic'
import { homeEpic } from './homeEpic'
import { moveEpic } from './moveEpic'
import { updateLightsEpic } from './updateLightsEpic'

export const robotControlsEpic: Epic = combineEpics(
  fetchLightsEpic,
  updateLightsEpic,
  homeEpic,
  moveEpic
)
