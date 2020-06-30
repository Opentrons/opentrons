// @flow

import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { restartEpic, startDiscoveryOnRestartEpic } from './restartEpic'
import { fetchResetOptionsEpic } from './fetchResetOptionsEpic'
import { resetConfigEpic, restartOnResetConfigEpic } from './resetConfigEpic'

export const robotAdminEpic: Epic = combineEpics(
  restartEpic,
  startDiscoveryOnRestartEpic,
  fetchResetOptionsEpic,
  resetConfigEpic,
  restartOnResetConfigEpic
)
