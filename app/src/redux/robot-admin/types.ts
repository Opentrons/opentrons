// restart status tracking types

export type RobotRestartStatus =
  | 'restart-pending'
  | 'restart-in-progress'
  | 'restart-succeeded'
  | 'restart-timed-out'
  | 'restart-failed'

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

export interface RestartState {
  bootId: string | null
  startTime: Date | null
  status: RobotRestartStatus
}

export type PerRobotAdminState = Partial<{
  restart: RestartState
}>

export type RobotAdminState = Partial<{
  [robotName: string]: null | undefined | PerRobotAdminState
}>
