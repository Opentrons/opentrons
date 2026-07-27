/** How long discovery should keep scanning after a restart is requested. */
export const RESTART_DISCOVERY_TIMEOUT_MS = 60000

// restart statuses
export const RESTART_PENDING_STATUS: 'restart-pending' = 'restart-pending'
export const RESTART_IN_PROGRESS_STATUS: 'restart-in-progress' =
  'restart-in-progress'
export const RESTART_FAILED_STATUS: 'restart-failed' = 'restart-failed'
export const RESTART_SUCCEEDED_STATUS: 'restart-succeeded' = 'restart-succeeded'

// action type strings

export const RESTART_STATUS_CHANGED: 'robotAdmin:RESTART_STATUS_CHANGED' =
  'robotAdmin:RESTART_STATUS_CHANGED'

// http paths still referenced by robot-update / fixtures

export const RESTART_PATH: '/server/restart' = '/server/restart'

export const SYSTEM_TIME_PATH: '/system/time' = '/system/time'
