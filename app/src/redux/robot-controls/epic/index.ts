// @flow
import { combineEpics } from 'redux-observable'

import { fetchLightsEpic } from './fetchLightsEpic'
import { updateLightsEpic } from './updateLightsEpic'
import { homeEpic } from './homeEpic'
import { moveEpic } from './moveEpic'

import type { Epic } from '../../types'

export const robotControlsEpic: Epic = combineEpics(
  fetchLightsEpic,
  updateLightsEpic,
  homeEpic,
  moveEpic
)
