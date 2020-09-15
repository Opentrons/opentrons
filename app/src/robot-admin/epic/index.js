// @flow

import { combineEpics } from 'redux-observable'

import { restartEpic, startDiscoveryOnRestartEpic } from './restartEpic'
import { fetchResetOptionsEpic } from './fetchResetOptionsEpic'
import { resetConfigEpic, restartOnResetConfigEpic } from './resetConfigEpic'
import { syncTimeOnConnectEpic } from './syncTimeOnConnectEpic'

import type { Epic } from '../../types'

export const robotAdminEpic: Epic = combineEpics(
  restartEpic,
  startDiscoveryOnRestartEpic,
  fetchResetOptionsEpic,
  resetConfigEpic,
  restartOnResetConfigEpic,
  syncTimeOnConnectEpic
)
