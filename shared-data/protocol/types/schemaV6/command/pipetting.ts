import { CommonCommandInfo, CommonCreateCommandInfo } from '.'
export type PipettingCommand =
  | AspirateCommand
  | DispenseCommand
  | AspirateAirGapCommand
  | DispenseAirGapCommand
  | BlowoutCommand
  | TouchTipCommand
  | PickUpTipCommand
  | DropTipCommand
export type PipettingCreateCommand =
  | AspirateCreateCommand
  | DispenseCreateCommand
  | AspirateAirGapCreateCommand
  | DispenseAirGapCreateCommand
  | BlowoutCreateCommand
  | TouchTipCreateCommand
  | PickUpTipCreateCommand
  | DropTipCreateCommand

export interface AspirateCommand extends CommonCommandInfo {
  commandType: 'aspirate'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface AspirateCreateCommand extends CommonCreateCommandInfo {
  commandType: 'aspirate'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseCommand extends CommonCommandInfo {
  commandType: 'dispense'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseCreateCommand extends CommonCreateCommandInfo {
  commandType: 'dispense'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface AspirateAirGapCommand extends CommonCommandInfo {
  commandType: 'aspirateAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface AspirateAirGapCreateCommand extends CommonCreateCommandInfo {
  commandType: 'aspirateAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseAirGapCommand extends CommonCommandInfo {
  commandType: 'dispenseAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseAirGapCreateCommand extends CommonCreateCommandInfo {
  commandType: 'dispenseAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface BlowoutCommand extends CommonCommandInfo {
  commandType: 'blowout'
  params: BlowoutParams
  result?: BasicLiquidHandlingResult
}
export interface BlowoutCreateCommand extends CommonCreateCommandInfo {
  commandType: 'blowout'
  params: BlowoutParams
  result?: BasicLiquidHandlingResult
}
export interface TouchTipCommand extends CommonCommandInfo {
  commandType: 'touchTip'
  params: TouchTipParams
  result?: BasicLiquidHandlingResult
}
export interface TouchTipCreateCommand extends CommonCreateCommandInfo {
  commandType: 'touchTip'
  params: TouchTipParams
  result?: BasicLiquidHandlingResult
}
export interface PickUpTipCommand extends CommonCommandInfo {
  id: string
  commandType: 'pickUpTip'
  params: PipetteAccessParams & WellLocationParam
}
export interface PickUpTipCreateCommand extends CommonCreateCommandInfo {
  id: string
  commandType: 'pickUpTip'
  params: PipetteAccessParams & WellLocationParam
}
export interface DropTipCommand extends CommonCommandInfo {
  commandType: 'dropTip'
  params: PipetteAccessParams & WellLocationParam
}
export interface DropTipCreateCommand extends CommonCreateCommandInfo {
  commandType: 'dropTip'
  params: PipetteAccessParams & WellLocationParam
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
  wellLocation?: {
    // default value is 'top'
    origin?: 'top' | 'bottom'
    offset?: {
      // mm
      // all values default to 0
      x?: number
      y?: number
      z?: number
    }
  }
}

interface BasicLiquidHandlingResult {
  volume: number // Amount of liquid in uL handled in the operation
}
