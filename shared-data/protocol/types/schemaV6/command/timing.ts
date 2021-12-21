import { CommonCommandInfo, CommonCreateCommandInfo } from '.'
export interface TimingCommand extends CommonCommandInfo {
  commandType: 'delay'
  params: DelayParams
  result?: {}
}
export interface TimingCreateCommand extends CommonCreateCommandInfo {
  commandType: 'delay'
  params: DelayParams
  result?: {}
}

interface DelayParams {
  wait: number | true
  message?: string
}

export interface PauseCommand extends CommonCommandInfo {
  commandType: 'pause'
  params: PauseParams
}
export interface PauseCreateCommand extends CommonCreateCommandInfo {
  commandType: 'pause'
  params: PauseParams
}

interface PauseParams {
  message?: string
}
