// @flow
import { combineEpics } from 'redux-observable'

import { fetchLightsEpic } from './fetchLightsEpic'
import { updateLightsEpic } from './updateLightsEpic'

import type { Epic } from '../../types'

export const robotControlsEpic: Epic = combineEpics(
  fetchLightsEpic,
  updateLightsEpic
)
