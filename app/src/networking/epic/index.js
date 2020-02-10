// @flow
import { combineEpics } from 'redux-observable'

import { statusEpic } from './statusEpic'

import type { StrictEpic } from '../../types'

export const networkingEpic: StrictEpic<> = combineEpics(statusEpic)
