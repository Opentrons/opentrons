export type PipettingCommand =
  | AspirateCommand
  | DispenseCommand
  | AspirateAirGapCommand
  | DispenseAirGapCommand
  | BlowoutCommand
  | TouchTipCommand
  | PickUpTipCommand
  | DropTipCommand

export interface AspirateCommand {
  commandType: 'aspirate'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseCommand {
  commandType: 'dispense'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface AspirateAirGapCommand {
  commandType: 'aspirateAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseAirGapCommand {
  commandType: 'dispenseAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface BlowoutCommand {
  commandType: 'blowout'
  params: BlowoutParams
  result?: BasicLiquidHandlingResult
}
export interface TouchTipCommand {
  commandType: 'touchTip'
  params: TouchTipParams
  result?: BasicLiquidHandlingResult
}
export interface PickUpTipCommand {
  commandType: 'pickUpTip'
  params: PipetteAccessParams
  result?: {}
}
export interface DropTipCommand {
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
    origin: 'top' | 'bottom'
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
