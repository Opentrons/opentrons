import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'

export type UnsafeRunTimeCommand =
    | UnsafeBlowoutInPlaceRunTimeCommand
    | UnsafeDropTipInPlaceRunTimeCommand

export type UnsafeCreateCommand =
    | UnsafeBlowoutInPlaceCreateCommand
    | UnsafeDropTipInPlaceCreateCommand

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
