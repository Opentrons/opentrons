// @flow

import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { fetchResetOptionsEpic } from './fetchResetOptionsEpic'
import { resetConfigEpic, restartOnResetConfigEpic } from './resetConfigEpic'
import { restartEpic, startDiscoveryOnRestartEpic } from './restartEpic'

export const robotAdminEpic: Epic = combineEpics(
  restartEpic,
  startDiscoveryOnRestartEpic,
  fetchResetOptionsEpic,
  resetConfigEpic,
  restartOnResetConfigEpic
)
