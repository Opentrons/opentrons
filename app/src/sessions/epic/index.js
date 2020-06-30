// @flow
import { combineEpics } from 'redux-observable'
import type { Epic } from '../../types'
import { createSessionEpic } from './createSessionEpic'
import { ensureSessionEpic } from './ensureSessionEpic'
import { fetchSessionEpic } from './fetchSessionEpic'
import { fetchAllSessionsEpic } from './fetchAllSessionsEpic'
import { fetchAllSessionsOnConnectEpic } from './fetchAllSessionsOnConnectEpic'
import { createSessionCommandEpic } from './createSessionCommandEpic'
import { deleteSessionEpic } from './deleteSessionEpic'

export const sessionsEpic: Epic = combineEpics(
  createSessionEpic,
  ensureSessionEpic,
  fetchSessionEpic,
  fetchAllSessionsEpic,
  fetchAllSessionsOnConnectEpic,
  createSessionCommandEpic,
  deleteSessionEpic
)
