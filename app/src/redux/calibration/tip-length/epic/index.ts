import { combineEpics } from 'redux-observable'
import { fetchTipLengthCalibrationsEpic } from './fetchTipLengthCalibrationsEpic'

import type { Epic } from '../../../types'

export const tipLengthCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchTipLengthCalibrationsEpic
)
