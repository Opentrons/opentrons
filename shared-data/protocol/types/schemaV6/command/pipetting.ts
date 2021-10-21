export type PipettingCommand =
  | {
      commandType: 'aspirate'
      params: AspDispAirgapParams
      result?: BasicLiquidHandlingResult
    }
  | {
      commandType: 'dispense'
      params: AspDispAirgapParams
      result?: BasicLiquidHandlingResult
    }
  | {
      commandType: 'aspirateAirGap'
      params: AspDispAirgapParams
      result?: BasicLiquidHandlingResult
    }
  | {
      commandType: 'dispenseAirGap'
      params: AspDispAirgapParams
      result?: BasicLiquidHandlingResult
    }
  | {
      commandType: 'blowout'
      params: BlowoutParams
      result?: BasicLiquidHandlingResult
    }
  | {
      commandType: 'touchTip'
      params: TouchTipParams
      result?: BasicLiquidHandlingResult
    }
  | {
      commandType: 'pickUpTip'
      params: PipetteAccessParams
      result?: {}
    }
  | {
      commandType: 'dropTip'
      params: PipetteAccessParams
      result?: {}
    }

type AspDispAirgapParams = FlowRateParams &
  PipetteAccessParams &
  VolumeParams &
  WellLocationParam
type BlowoutParams = FlowRateParams & PipetteAccessParams & WellLocationParam
type TouchTipParams = PipetteAccessParams & WellLocationParam

interface FlowRateParams {
  flowRate: number // µL/s
}

interface PipetteAccessParams {
  pipetteId: string
  labwareId: string
  wellName: string
}

interface VolumeParams {
  volume: number // µL
}

interface WellLocationParam {
  wellLocation: {
    origin: string // e.g. 'top' || 'bottom'
    offset: {
      // mm
      x: number
      y: number
      z: number
    }
  }
}

interface BasicLiquidHandlingResult {
  volume: number // Amount of liquid in uL handled in the operation
}
