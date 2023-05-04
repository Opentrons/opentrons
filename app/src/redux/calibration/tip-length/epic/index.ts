import type { Epic } from '../../../types'
import { fetchTipLengthCalibrationsEpic } from './fetchTipLengthCalibrationsEpic'
import { combineEpics } from 'redux-observable'

export const tipLengthCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchTipLengthCalibrationsEpic
)
