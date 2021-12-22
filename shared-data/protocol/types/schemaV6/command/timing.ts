import { CommonCommandInfo } from '.'
export interface TimingCreateCommand extends CommonCommandInfo {
  commandType: 'delay'
  params: DelayParams
  result?: {}
}
export interface TimingCommand extends TimingCreateCommand {
  key: string
}

interface DelayParams {
  wait: number | true
  message?: string
}

export interface PauseCreateCommand extends CommonCommandInfo {
  commandType: 'pause'
  params: PauseParams
}
export interface PauseCommand extends PauseCreateCommand {
  key: string
}

interface PauseParams {
  message?: string
}
