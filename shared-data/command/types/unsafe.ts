import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { MotorAxes } from '../../js/types'

export type UnsafeRunTimeCommand =
  | UnsafeBlowoutInPlaceRunTimeCommand
  | UnsafeDropTipInPlaceRunTimeCommand
  | UnsafeUpdatePositionEstimatorsRunTimeCommand
  | UnsafeEngageAxesRunTimeCommand
  | UnsafeUngripLabwareRunTimeCommand

export type UnsafeCreateCommand =
  | UnsafeBlowoutInPlaceCreateCommand
  | UnsafeDropTipInPlaceCreateCommand
  | UnsafeUpdatePositionEstimatorsCreateCommand
  | UnsafeEngageAxesCreateCommand
  | UnsafeUngripLabwareCreateCommand

export interface UnsafeBlowoutInPlaceParams {
  pipetteId: string
  flowRate: number // µL/s
}

export interface UnsafeBlowoutInPlaceCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'unsafe/blowOutInPlace'
  params: UnsafeBlowoutInPlaceParams
}
export interface UnsafeBlowoutInPlaceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    UnsafeBlowoutInPlaceCreateCommand {
  result?: {}
}

export interface UnsafeDropTipInPlaceParams {
  pipetteId: string
}

export interface UnsafeDropTipInPlaceCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'unsafe/dropTipInPlace'
  params: UnsafeDropTipInPlaceParams
}
export interface UnsafeDropTipInPlaceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    UnsafeDropTipInPlaceCreateCommand {
  result?: any
}

export interface UnsafeUpdatePositionEstimatorsParams {
  axes: MotorAxes
}

export interface UnsafeUpdatePositionEstimatorsCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'unsafe/updatePositionEstimators'
  params: UnsafeUpdatePositionEstimatorsParams
}
export interface UnsafeUpdatePositionEstimatorsRunTimeCommand
  extends CommonCommandRunTimeInfo,
    UnsafeUpdatePositionEstimatorsCreateCommand {
  result?: any
}

export interface UnsafeEngageAxesParams {
  axes: MotorAxes
}

export interface UnsafeEngageAxesCreateCommand extends CommonCommandCreateInfo {
  commandType: 'unsafe/engageAxes'
  params: UnsafeUpdatePositionEstimatorsParams
}
export interface UnsafeEngageAxesRunTimeCommand
  extends CommonCommandRunTimeInfo,
    UnsafeEngageAxesCreateCommand {
  result?: any
}

export interface UnsafeUngripLabwareParams {
}

export interface UnsafeUngripLabwareCreateCommand extends CommonCommandCreateInfo {
  commandType: 'unsafe/ungripLabware'
  params: UnsafeUngripLabwareParams
}
export interface UnsafeUngripLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo,
  UnsafeUngripLabwareCreateCommand {
  result?: any
}
