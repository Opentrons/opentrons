// @flow

import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchCalibrationStatusEpic } from './fetchCalibrationStatusEpic'

export const calibrationEpic: Epic = combineEpics(fetchCalibrationStatusEpic)
