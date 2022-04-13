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

interface DelayParams {
  wait: number | true
  message?: string
}

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
