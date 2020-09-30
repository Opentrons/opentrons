// @flow

import { combineEpics } from 'redux-observable'
import { fetchLabwareCalibrationsEpic } from './fetchLabwareCalibrationsEpic'
import { fetchLabwareCalibrationsOnSessionUpdateEpic } from './fetchLabwareCalibrationsOnSessionUpdateEpic'

import type { Epic } from '../../../types'

export const labwareCalibrationEpic: Epic = combineEpics(
  fetchLabwareCalibrationsEpic,
  fetchLabwareCalibrationsOnSessionUpdateEpic
)
