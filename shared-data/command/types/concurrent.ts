import type { CommonCommandCreateInfo, CommonCommandRunTimeInfo } from '.'

export type ConcurrentCreateCommand = CreateTimerCreateCommand
export type ConcurrentRunTimeCommand = CreateTimerRunTimeCommand
export interface CreateTimerParams {
  time: number
  task_id?: string | null
}

export interface CreateTimerCreateCommand extends CommonCommandCreateInfo {
  commandType: 'createTimer'
  params: CreateTimerParams
}

export interface CreateTimerResult {
  time: number
  task_id: string
}
export interface CreateTimerRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CreateTimerCreateCommand {
  result?: CreateTimerResult | null
}
