import { combineEpics } from 'redux-observable'

import type { Epic } from '../../../types'
import { fetchPipetteOffsetCalibrationsEpic } from './fetchPipetteOffsetCalibrationsEpic'

export const pipetteOffsetCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchPipetteOffsetCalibrationsEpic
)
