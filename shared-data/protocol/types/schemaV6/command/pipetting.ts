import { CommonCommandRunTimeInfo } from '.'
export type PipettingRunTimeCommand =
  | AspirateRunTimeCommand
  | DispenseRunTimeCommand
  | AspirateAirGapRunTimeCommand
  | DispenseAirGapRunTimeCommand
  | BlowoutRunTimeCommand
  | TouchTipRunTimeCommand
  | PickUpTipRunTimeCommand
  | DropTipRunTimeCommand
export type PipettingCreateCommand =
  | AspirateCreateCommand
  | DispenseCreateCommand
  | AspirateAirGapCreateCommand
  | DispenseAirGapCreateCommand
  | BlowoutCreateCommand
  | TouchTipCreateCommand
  | PickUpTipCreateCommand
  | DropTipCreateCommand

export interface AspirateCreateCommand {
  commandType: 'aspirate'
  params: AspDispAirgapParams
}
export interface AspirateRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AspirateCreateCommand {
  result: BasicLiquidHandlingResult
}
export interface DispenseCreateCommand {
  commandType: 'dispense'
  params: AspDispAirgapParams
}
export interface DispenseRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DispenseCreateCommand {
  result: BasicLiquidHandlingResult
}
export interface AspirateAirGapCreateCommand {
  commandType: 'aspirateAirGap'
  params: AspDispAirgapParams
}
export interface AspirateAirGapRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AspirateAirGapCreateCommand {
  result: BasicLiquidHandlingResult
}
export interface DispenseAirGapCreateCommand {
  commandType: 'dispenseAirGap'
  params: AspDispAirgapParams
}
export interface DispenseAirGapRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DispenseAirGapCreateCommand {
  result: BasicLiquidHandlingResult
}
export interface BlowoutCreateCommand {
  commandType: 'blowout'
  params: BlowoutParams
}
export interface BlowoutRunTimeCommand
  extends CommonCommandRunTimeInfo,
    BlowoutCreateCommand {
  result: BasicLiquidHandlingResult
}
export interface TouchTipCreateCommand {
  commandType: 'touchTip'
  params: TouchTipParams
}
export interface TouchTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TouchTipCreateCommand {
  result: BasicLiquidHandlingResult
}
export interface PickUpTipCreateCommand {
  commandType: 'pickUpTip'
  params: PickUpTipParams
}
export interface PickUpTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    PickUpTipCreateCommand {
  result: any
}
export interface DropTipCreateCommand {
  commandType: 'dropTip'
  params: DropTipParams
}
export interface DropTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DropTipCreateCommand {
  result: any
}

export type AspDispAirgapParams = FlowRateParams &
  PipetteAccessParams &
  VolumeParams &
  WellLocationParam
export type BlowoutParams = FlowRateParams & PipetteAccessParams & WellLocationParam
export type TouchTipParams = PipetteAccessParams & WellLocationParam
export type DropTipParams = TouchTipParams
export type PickUpTipParams = TouchTipParams

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
