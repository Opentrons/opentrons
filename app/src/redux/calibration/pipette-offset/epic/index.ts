import { combineEpics } from 'redux-observable'
import { fetchPipetteOffsetCalibrationsEpic } from './fetchPipetteOffsetCalibrationsEpic'

import type { Epic } from '../../../types'

export const pipetteOffsetCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchPipetteOffsetCalibrationsEpic
)
