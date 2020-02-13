// @flow
import { combineEpics } from 'redux-observable'

import { statusEpic } from './statusEpic'

import type { Epic } from '../../types'

export const networkingEpic: Epic = combineEpics(statusEpic)
