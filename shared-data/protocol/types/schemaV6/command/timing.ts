export interface TimingCommand {
  commandType: 'delay'
  params: DelayParams
  result?: {}
}

interface DelayParams {
  wait: number | true
  message?: string
}
