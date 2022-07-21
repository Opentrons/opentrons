import { combineEpics } from 'redux-observable'

import { restartEpic, startDiscoveryOnRestartEpic } from './restartEpic'
import { fetchResetOptionsEpic } from './fetchResetOptionsEpic'
import { resetConfigEpic, restartOnResetConfigEpic } from './resetConfigEpic'
import { syncSystemTimeEpic } from './syncSystemTimeEpic'
import { trackRestartsEpic } from './trackRestartsEpic'

import type { Epic } from '../../types'

export const robotAdminEpic = combineEpics<Epic>(
  restartEpic,
  startDiscoveryOnRestartEpic,
  fetchResetOptionsEpic,
  resetConfigEpic,
  restartOnResetConfigEpic,
  syncSystemTimeEpic,
  trackRestartsEpic
)
