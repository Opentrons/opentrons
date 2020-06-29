// @flow
import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { createSessionCommandEpic } from './createSessionCommandEpic'
import { createSessionEpic } from './createSessionEpic'
import { deleteSessionEpic } from './deleteSessionEpic'
import { ensureSessionEpic } from './ensureSessionEpic'
import { fetchAllSessionsEpic } from './fetchAllSessionsEpic'
import { fetchAllSessionsOnConnectEpic } from './fetchAllSessionsOnConnectEpic'
import { fetchSessionEpic } from './fetchSessionEpic'

export const sessionsEpic: Epic = combineEpics(
  createSessionEpic,
  ensureSessionEpic,
  fetchSessionEpic,
  fetchAllSessionsEpic,
  fetchAllSessionsOnConnectEpic,
  createSessionCommandEpic,
  deleteSessionEpic
)
