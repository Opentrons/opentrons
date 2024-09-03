import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { MotorAxes } from '../../js/types'

export type UnsafeRunTimeCommand =
  | UnsafeBlowoutInPlaceRunTimeCommand
  | UnsafeDropTipInPlaceRunTimeCommand
  | UnsafeUpdatePositionEstimatorsRunTimeCommand

export type UnsafeCreateCommand =
  | UnsafeBlowoutInPlaceCreateCommand
  | UnsafeDropTipInPlaceCreateCommand
  | UnsafeUpdatePositionEstimatorsCreateCommand

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
