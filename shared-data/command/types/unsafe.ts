import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'

export type UnsafeRunTimeCommand = UnsafeBlowoutInPlaceRunTimeCommand

export type UnsafeCreateCommand = UnsafeBlowoutInPlaceCreateCommand

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
