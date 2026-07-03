import { combineEpics } from 'redux-observable'

import { fetchResetOptionsEpic } from './fetchResetOptionsEpic'
import { resetConfigEpic, restartOnResetConfigEpic } from './resetConfigEpic'
import { restartEpic, startDiscoveryOnRestartEpic } from './restartEpic'
import { shutdownEpic } from './shutdownEpic'
import { syncSystemTimeEpic } from './syncSystemTimeEpic'
import { trackRestartsEpic } from './trackRestartsEpic'

import type { Epic } from '../../types'

export const robotAdminEpic = combineEpics<Epic>(
  restartEpic,
  startDiscoveryOnRestartEpic,
  shutdownEpic,
  fetchResetOptionsEpic,
  resetConfigEpic,
  restartOnResetConfigEpic,
  syncSystemTimeEpic,
  trackRestartsEpic
)
