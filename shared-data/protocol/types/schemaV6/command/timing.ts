import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
export interface TimingCreateCommand extends CommonCommandCreateInfo {
  commandType: 'delay'
  params: DelayParams
}
export interface TimingRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TimingCreateCommand {
  result: {}
}

interface DelayUntilResumeParams {
  waitForResume: true
  message?: string
}

interface DelayForDurationParams {
  seconds: number
  message?: string
}

type DelayParams = DelayUntilResumeParams | DelayForDurationParams

export interface PauseCreateCommand extends CommonCommandCreateInfo {
  commandType: 'pause'
  params: PauseParams
}
export interface PauseRunTimeCommand
  extends CommonCommandRunTimeInfo,
    PauseCreateCommand {
  result: any
}

interface PauseParams {
  message?: string
}
