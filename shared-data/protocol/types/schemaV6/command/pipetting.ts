import { CommonCommandInfo } from '.'
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

export interface AspirateCreateCommand extends CommonCommandInfo {
  commandType: 'aspirate'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface AspirateCommand extends AspirateCreateCommand {
  key: string
}
export interface DispenseCreateCommand extends CommonCommandInfo {
  commandType: 'dispense'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseCommand extends DispenseCreateCommand {
  key: string
}
export interface AspirateAirGapCreateCommand extends CommonCommandInfo {
  commandType: 'aspirateAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface AspirateAirGapCommand extends AspirateAirGapCreateCommand {
  key: string
}
export interface DispenseAirGapCreateCommand extends CommonCommandInfo {
  commandType: 'dispenseAirGap'
  params: AspDispAirgapParams
  result?: BasicLiquidHandlingResult
}
export interface DispenseAirGapCommand extends DispenseAirGapCreateCommand {
  key: string
}
export interface BlowoutCreateCommand extends CommonCommandInfo {
  commandType: 'blowout'
  params: BlowoutParams
  result?: BasicLiquidHandlingResult
}
export interface BlowoutCommand extends BlowoutCreateCommand {
  key: string
}
export interface TouchTipCreateCommand extends CommonCommandInfo {
  commandType: 'touchTip'
  params: TouchTipParams
  result?: BasicLiquidHandlingResult
}
export interface TouchTipCommand extends TouchTipCreateCommand {
  key: string
}
export interface PickUpTipCreateCommand extends CommonCommandInfo {
  id: string
  commandType: 'pickUpTip'
  params: PipetteAccessParams & WellLocationParam
}
export interface PickUpTipCommand extends PickUpTipCreateCommand {
  key: string
}
export interface DropTipCreateCommand extends CommonCommandInfo {
  commandType: 'dropTip'
  params: PipetteAccessParams & WellLocationParam
}
export interface DropTipCommand extends DropTipCreateCommand {
  key: string
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
