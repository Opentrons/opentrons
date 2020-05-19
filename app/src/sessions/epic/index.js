// @flow
import { combineEpics } from 'redux-observable'
import { createSessionEpic } from './createSessionEpic'
import { fetchSessionEpic } from './fetchSessionEpic'
import { createSessionCommandEpic } from './createSessionCommandEpic'
import { deleteSessionEpic } from './deleteSessionEpic'

import type { Epic } from '../../types'

export const sessionsEpic: Epic = combineEpics(
  createSessionEpic,
  fetchSessionEpic,
  createSessionCommandEpic,
  deleteSessionEpic
)
