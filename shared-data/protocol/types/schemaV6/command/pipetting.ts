export type PipettingCommand =
  | { commandType: 'aspirate'; params: AspDispAirgapParams }
  | { commandType: 'dispense'; params: AspDispAirgapParams }
  | { commandType: 'aspirateAirGap'; params: AspDispAirgapParams }
  | { commandType: 'dispenseAirGap'; params: AspDispAirgapParams }
  | { commandType: 'blowout'; params: BlowoutParams }
  | { commandType: 'touchTip'; params: TouchTipParams }
  | { commandType: 'pickUpTip'; params: PipetteAccessParams }
  | { commandType: 'dropTip'; params: PipetteAccessParams }

type AspDispAirgapParams = FlowRateParams &
  PipetteAccessParams &
  VolumeParams &
  WellLocationParam
type BlowoutParams = FlowRateParams & PipetteAccessParams & WellLocationParam
type TouchTipParams = PipetteAccessParams & WellLocationParam

interface FlowRateParams {
  flowRate: number
}

interface PipetteAccessParams {
  pipetteId: string
  labwareId: string
  wellName: string
}

interface VolumeParams {
  volume: number
}

interface WellLocationParam {
  wellLocation: {
    origin: string // e.g. 'top' || 'bottom'
    offset: {
      x: number
      y: number
      z: number
    }
  }
}
