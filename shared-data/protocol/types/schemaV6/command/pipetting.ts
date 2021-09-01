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
  pipette: string
  labware: string
  well: string
}

interface VolumeParams {
  volume: number
}

interface OffsetParams {
  offsetFromBottomMm: number
}
