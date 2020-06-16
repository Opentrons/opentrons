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
export const INITIALIZED: 'config:INITIALIZED' = 'config:INITIALIZED'
export const VALUE_UPDATED: 'config:VALUE_UPDATED' = 'config:VALUE_UPDATED'
export const UPDATE_VALUE: 'config:UPDATE_VALUE' = 'config:UPDATE_VALUE'
export const RESET_VALUE: 'config:RESET_VALUE' = 'config:RESET_VALUE'
export const TOGGLE_VALUE: 'config:TOGGLE_VALUE' = 'config:TOGGLE_VALUE'
export const ADD_UNIQUE_VALUE: 'config:ADD_UNIQUE_VALUE' =
  'config:ADD_UNIQUE_VALUE'
export const SUBTRACT_VALUE: 'config:SUBTRACT_VALUE' = 'config:SUBTRACT_VALUE'
