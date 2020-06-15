// @flow

import type { DevInternalFlag } from './types'

export const CONFIG_VERSION_LATEST: 1 = 1

export const DEV_INTERNAL_FLAGS: Array<DevInternalFlag> = [
  'allPipetteConfig',
  'enableBundleUpload',
  'enableRobotCalCheck',
  'enableTipLengthCal',
]

// action type constants

export const UPDATE: 'config:UPDATE' = 'config:UPDATE'
export const RESET: 'config:RESET' = 'config:RESET'
