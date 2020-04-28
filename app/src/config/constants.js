// @flow

import type { DevInternalFlag } from './types'

export const DEV_INTERNAL_FLAGS: Array<DevInternalFlag> = [
  'allPipetteConfig',
  'enableBundleUpload',
  'enableRobotCalCheck',
  'enableSystemInfo',
]

// action type constants

export const UPDATE: 'config:UPDATE' = 'config:UPDATE'
export const RESET: 'config:RESET' = 'config:RESET'
