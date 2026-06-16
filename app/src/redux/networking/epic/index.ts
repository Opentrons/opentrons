import { combineEpics } from 'redux-observable'

import { disconnectEpic } from './disconnectEpic'
import { fetchEapOptionsEpic } from './fetchEapOptionsEpic'
import { statusEpic } from './statusEpic'
import { wifiConfigureEpic } from './wifiConfigureEpic'

import type { Epic } from '../../types'

export const networkingEpic: Epic = combineEpics<Epic>(
  fetchEapOptionsEpic,
  statusEpic,
  wifiConfigureEpic,
  disconnectEpic
)
