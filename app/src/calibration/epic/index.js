// @flow
import { combineEpics } from 'redux-observable'
import { fetchDeckCheckSessionEpic } from './fetchDeckCheckSessionEpic'
import { endDeckCheckSessionEpic } from './endDeckCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  fetchDeckCheckSessionEpic,
  endDeckCheckSessionEpic
)
