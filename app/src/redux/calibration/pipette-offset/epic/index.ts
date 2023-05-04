import type { Epic } from '../../../types'
import { fetchPipetteOffsetCalibrationsEpic } from './fetchPipetteOffsetCalibrationsEpic'
import { combineEpics } from 'redux-observable'

export const pipetteOffsetCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchPipetteOffsetCalibrationsEpic
)
