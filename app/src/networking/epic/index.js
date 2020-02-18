// @flow
import { combineEpics } from 'redux-observable'

import { statusEpic } from './statusEpic'
import { wifiListEpic } from './wifiListEpic'

import type { Epic } from '../../types'

export const networkingEpic: Epic = combineEpics(statusEpic, wifiListEpic)
