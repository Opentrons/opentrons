import type { CommonCommandCreateInfo, CommonCommandRunTimeInfo } from '.'

export type ConcurrentCreateCommand =
  CreateTimerCreateCommand | WaitForTasksCreateCommand
export type ConcurrentRunTimeCommand =
  CreateTimerRunTimeCommand | WaitForTasksRunTimeCommand
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
  extends CommonCommandRunTimeInfo, CreateTimerCreateCommand {
  result?: CreateTimerResult | null
}

export interface WaitForTasksParams {
  task_ids: string[]
}

export interface WaitForTasksCreateCommand extends CommonCommandCreateInfo {
  commandType: 'waitForTasks'
  params: WaitForTasksParams
}

export interface WaitForTasksResult {
  task_ids: string[]
}

export interface WaitForTasksRunTimeCommand
  extends CommonCommandRunTimeInfo, WaitForTasksCreateCommand {
  result?: WaitForTasksResult | null
}
