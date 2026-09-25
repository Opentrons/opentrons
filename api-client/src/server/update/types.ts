export type RobotUpdateSessionStage =
  | 'awaiting-file'
  | 'validating'
  | 'writing'
  | 'done'
  | 'ready-for-restart'
  | 'error'

export interface CreateRobotUpdateSessionData {
  token: string
  auto_commit_and_restart?: boolean
}

export interface CreateRobotUpdateSessionRequest {
  auto_commit_and_restart: boolean
}

export interface RobotUpdateSessionStatus {
  stage: RobotUpdateSessionStage
  progress: number | null
  message: string
  error?: string
}

export interface CancelRobotUpdateSessionData {
  message?: string
}

export interface CommitRobotUpdateSessionData {
  message?: string
  token?: string
}
