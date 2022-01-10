import { CommonCommandInfo, CommonCommandRunTimeInfo } from '.'
export interface TimingCreateCommand extends CommonCommandInfo {
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

export interface PauseCreateCommand extends CommonCommandInfo {
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
