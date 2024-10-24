import type {
  CommonCommandRunTimeInfo,
  CommonCommandCreateInfo,
  OnDeckLabwareLocation,
} from '.'
import type { MotorAxes } from '../../js/types'

export type UnsafeRunTimeCommand =
  | UnsafeBlowoutInPlaceRunTimeCommand
  | UnsafeDropTipInPlaceRunTimeCommand
  | UnsafeUpdatePositionEstimatorsRunTimeCommand
  | UnsafeEngageAxesRunTimeCommand
  | UnsafeUngripLabwareRunTimeCommand
  | UnsafePlaceLabwareRunTimeCommand

export type UnsafeCreateCommand =
  | UnsafeBlowoutInPlaceCreateCommand
  | UnsafeDropTipInPlaceCreateCommand
  | UnsafeUpdatePositionEstimatorsCreateCommand
  | UnsafeEngageAxesCreateCommand
  | UnsafeUngripLabwareCreateCommand
  | UnsafePlaceLabwareCreateCommand

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

export interface UnsafeUngripLabwareCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'unsafe/ungripLabware'
  params: {}
}
export interface UnsafeUngripLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo,
    UnsafeUngripLabwareCreateCommand {
  result?: any
}
export interface UnsafePlaceLabwareParams {
  labwareId: string
  location: OnDeckLabwareLocation
}
export interface UnsafePlaceLabwareCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'unsafe/placeLabware'
  params: UnsafePlaceLabwareParams
}
export interface UnsafePlaceLabwareRunTimeCommand
  extends CommonCommandRunTimeInfo,
    UnsafePlaceLabwareCreateCommand {
  result?: any
}
