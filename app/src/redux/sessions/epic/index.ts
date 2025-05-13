import { combineEpics } from 'redux-observable'

import { createSessionCommandEpic } from './createSessionCommandEpic'
import { createSessionEpic } from './createSessionEpic'
import { deleteSessionEpic } from './deleteSessionEpic'
import { ensureSessionEpic } from './ensureSessionEpic'
import { fetchAllSessionsEpic } from './fetchAllSessionsEpic'
import { fetchSessionEpic } from './fetchSessionEpic'

import type { Epic } from '../../types'

export const sessionsEpic: Epic = combineEpics<Epic>(
  createSessionEpic,
  ensureSessionEpic,
  fetchSessionEpic,
  fetchAllSessionsEpic,
  createSessionCommandEpic,
  deleteSessionEpic
)
