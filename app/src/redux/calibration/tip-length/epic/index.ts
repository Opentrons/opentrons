import { combineEpics } from 'redux-observable'

import type { Epic } from '../../../types'
import { fetchTipLengthCalibrationsEpic } from './fetchTipLengthCalibrationsEpic'

export const tipLengthCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchTipLengthCalibrationsEpic
)
