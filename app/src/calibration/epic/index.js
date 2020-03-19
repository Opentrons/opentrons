// @flow
import { combineEpics } from 'redux-observable'
import { fetchDeckCheckSessionEpic } from './fetchDeckCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(fetchDeckCheckSessionEpic)
