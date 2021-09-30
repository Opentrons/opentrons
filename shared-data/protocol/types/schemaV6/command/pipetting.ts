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
  OffsetParams
type BlowoutParams = FlowRateParams & PipetteAccessParams & OffsetParams
type TouchTipParams = PipetteAccessParams & OffsetParams

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

interface OffsetParams {
  offset: {
    x: number
    y: number
    z: number
  }
}
