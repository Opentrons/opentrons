import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchResetOptionsEpic } from './fetchResetOptionsEpic'
import { resetConfigEpic, restartOnResetConfigEpic } from './resetConfigEpic'
import { restartEpic, startDiscoveryOnRestartEpic } from './restartEpic'
import { syncSystemTimeEpic } from './syncSystemTimeEpic'
import { trackRestartsEpic } from './trackRestartsEpic'

export const robotAdminEpic = combineEpics<Epic>(
  restartEpic,
  startDiscoveryOnRestartEpic,
  fetchResetOptionsEpic,
  resetConfigEpic,
  restartOnResetConfigEpic,
  syncSystemTimeEpic,
  trackRestartsEpic
)
