import { CommonCommandRunTimeInfo } from '.'
export interface TimingCreateCommand {
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

export interface PauseCreateCommand {
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
