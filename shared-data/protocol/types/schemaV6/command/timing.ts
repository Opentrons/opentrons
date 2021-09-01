export type TimingCommand = { commandType: 'delay'; params: DelayParams }

interface DelayParams {
  wait: number | true
  message?: string
}
