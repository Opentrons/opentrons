import { combineEpics } from 'redux-observable'
import { createSessionEpic } from './createSessionEpic'
import { ensureSessionEpic } from './ensureSessionEpic'
import { fetchSessionEpic } from './fetchSessionEpic'
import { fetchAllSessionsEpic } from './fetchAllSessionsEpic'
import { fetchAllSessionsOnConnectEpic } from './fetchAllSessionsOnConnectEpic'
import { createSessionCommandEpic } from './createSessionCommandEpic'
import { deleteSessionEpic } from './deleteSessionEpic'

import type { Epic } from '../../types'

export const sessionsEpic: Epic = combineEpics<Epic>(
  createSessionEpic,
  ensureSessionEpic,
  fetchSessionEpic,
  fetchAllSessionsEpic,
  fetchAllSessionsOnConnectEpic,
  createSessionCommandEpic,
  deleteSessionEpic
)
