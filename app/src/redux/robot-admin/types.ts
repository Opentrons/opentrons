// common types

export type RobotRestartStatus =
  | 'restart-pending'
  | 'restart-in-progress'
  | 'restart-succeeded'
  | 'restart-timed-out'
  | 'restart-failed'

export type RobotAdminStatus =
  'up' | 'down' | 'restart-pending' | 'restarting' | 'restart-failed'

export interface ResetConfigOption {
  id: string
  name: string
  description: string
}

export interface ResetConfigRequest {
  resetLabwareOffsets: boolean

  /**
   * Options to pass as-is to `POST /settings/reset`.
   * The possible keys are theoretically dynamic,
   * coming from `GET /settings/reset/options`.
   */
  settingsResets: {
    [optionId: string]: boolean | undefined
  }
}

// action types

export interface RestartStatusChangedAction {
  type: 'robotAdmin:RESTART_STATUS_CHANGED'
  payload: {
    robotName: string
    restartStatus: RobotRestartStatus
    bootId: string | null
    startTime: Date | null
  }
}

export type RobotAdminAction = RestartStatusChangedAction

// state types

export interface RestartState {
  bootId: string | null
  startTime: Date | null
  status: RobotRestartStatus
}

export type PerRobotAdminState = Partial<{
  status: RobotAdminStatus
  restart: RestartState
}>

export type RobotAdminState = Partial<{
  [robotName: string]: null | undefined | PerRobotAdminState
}>
