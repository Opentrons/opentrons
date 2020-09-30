// @flow

// general constants

export const RESTART_PENDING_STATUS: 'restart-pending' = 'restart-pending'
export const RESTARTING_STATUS: 'restarting' = 'restarting'
export const RESTART_FAILED_STATUS: 'restart-failed' = 'restart-failed'
export const UP_STATUS: 'up' = 'up'
export const DOWN_STATUS: 'down' = 'down'

// action type strings

export const RESTART: 'robotAdmin:RESTART' = 'robotAdmin:RESTART'

export const RESTART_SUCCESS: 'robotAdmin:RESTART_SUCCESS' =
  'robotAdmin:RESTART_SUCCESS'

export const RESTART_FAILURE: 'robotAdmin:RESTART_FAILURE' =
  'robotAdmin:RESTART_FAILURE'

export const FETCH_RESET_CONFIG_OPTIONS: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS' =
  'robotAdmin:FETCH_RESET_CONFIG_OPTIONS'

export const FETCH_RESET_CONFIG_OPTIONS_SUCCESS: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS' =
  'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS'

export const FETCH_RESET_CONFIG_OPTIONS_FAILURE: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_FAILURE' =
  'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_FAILURE'

export const RESET_CONFIG: 'robotAdmin:RESET_CONFIG' = 'robotAdmin:RESET_CONFIG'

export const RESET_CONFIG_SUCCESS: 'robotAdmin:RESET_CONFIG_SUCCESS' =
  'robotAdmin:RESET_CONFIG_SUCCESS'

export const RESET_CONFIG_FAILURE: 'robotAdmin:RESET_CONFIG_FAILURE' =
  'robotAdmin:RESET_CONFIG_FAILURE'

// http paths

export const RESTART_PATH: '/server/restart' = '/server/restart'

export const RESET_CONFIG_PATH: '/settings/reset' = '/settings/reset'

export const RESET_CONFIG_OPTIONS_PATH: '/settings/reset/options' =
  '/settings/reset/options'

export const SYSTEM_TIME_PATH: '/system/time' = '/system/time'
