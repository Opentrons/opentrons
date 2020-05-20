// @flow
import { combineEpics } from 'redux-observable'
import { createSessionEpic } from './createSessionEpic'
import { fetchSessionEpic } from './fetchSessionEpic'
import { fetchAllSessionsEpic } from './fetchAllSessionsEpic'
import { fetchAllSessionsOnConnectEpic } from './fetchAllSessionsOnConnectEpic'
import { createSessionCommandEpic } from './createSessionCommandEpic'
import { deleteSessionEpic } from './deleteSessionEpic'

import type { Epic } from '../../types'

export const sessionsEpic: Epic = combineEpics(
  createSessionEpic,
  fetchSessionEpic,
  fetchAllSessionsEpic,
  fetchAllSessionsOnConnectEpic,
  createSessionCommandEpic,
  deleteSessionEpic
)
