import { CommonCommandInfo } from '.'
export interface TimingCommand extends CommonCommandInfo {
  commandType: 'delay'
  params: DelayParams
  result?: {}
}

interface DelayParams {
  wait: number | true
  message?: string
}
