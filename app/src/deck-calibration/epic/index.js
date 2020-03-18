// @flow
import { combineEpics } from 'redux-observable'
import { startDeckCheckEpic } from './startDeckCheckEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(startDeckCheckEpic)
