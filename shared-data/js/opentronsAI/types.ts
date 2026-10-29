// Opentrons AI command args
// params are sourced from CreateCommand where available.

import type {
  AddressableOffsetVector,
  CreateCommand,
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
  WellLocation,
} from '../../protocol'
import type { LatestCommandSchemaCommandType } from './utils'

type ParamsForOpentronsAICommand<T extends LatestCommandSchemaCommandType> =
  T extends CreateCommand['commandType']
    ? Extract<CreateCommand, { commandType: T }>['params']
    : never

export interface CommonArgs {
  /** NOTE: stepNumber probably shouldn't be optional but making it optional
   * for the sake of not having to make too many changes for PD 8.5.2
   * this should be refactored to not be optional for PD 8.6.0
   * making it optional saves a lot of changes in unit tests
   */
  stepNumber?: number
  /** Optional user-readable name for this step */
  name?: string | null
  /** Optional user-readable description/notes for this step */
  description?: string | null
}

type OpentronsAIBaseArgs<T extends LatestCommandSchemaCommandType> =
  CommonArgs & {
    commandCreatorFnName: T
  } & ParamsForOpentronsAICommand<T>

/**
 * Runtime parameters are passed as their names. Any arg that is not already a
 * string can also be that name. `commandCreatorFnName` and CommonArgs stay put.
 */
type RuntimeParameterValue<T> = T extends any
  ? string extends T
    ? T
    : T extends null | undefined
      ? T
      : T extends readonly [unknown, ...unknown[]]
        ? { [K in keyof T]: RuntimeParameterValue<T[K]> }
        : T extends ReadonlyArray<infer U>
          ? Array<RuntimeParameterValue<U>>
          : T extends object
            ? { [K in keyof T]: RuntimeParameterValue<T[K]> }
            : T | string
  : never

export type WithRuntimeParameterStrings<T> = {
  [K in keyof T]: K extends
    'commandCreatorFnName' | 'stepNumber' | 'name' | 'description'
    ? T[K]
    : RuntimeParameterValue<T[K]>
}

type RuntimeParameterArgs<T extends LatestCommandSchemaCommandType> =
  WithRuntimeParameterStrings<OpentronsAIBaseArgs<T>>

export type AirGapInPlaceArgs = RuntimeParameterArgs<'airGapInPlace'>
export interface AspirateArgs extends OpentronsAIBaseArgs<'aspirate'> {}
export type AspirateInPlaceArgs = RuntimeParameterArgs<'aspirateInPlace'>
export type AspirateWhileTrackingArgs =
  RuntimeParameterArgs<'aspirateWhileTracking'>
export type BlowOutInPlaceArgs = RuntimeParameterArgs<'blowOutInPlace'>
export interface BlowoutArgs extends OpentronsAIBaseArgs<'blowout'> {}
export type ConfigureForVolumeArgs = RuntimeParameterArgs<'configureForVolume'>
export type ConfigureNozzleLayoutArgs =
  RuntimeParameterArgs<'configureNozzleLayout'>
export type DispenseInPlaceArgs = RuntimeParameterArgs<'dispenseInPlace'>
export type DispenseWhileTrackingArgs =
  RuntimeParameterArgs<'dispenseWhileTracking'>
export type DropTipInPlaceArgs = RuntimeParameterArgs<'dropTipInPlace'>
export type HomeArgs = RuntimeParameterArgs<'home'>
export type MoveRelativeArgs = RuntimeParameterArgs<'moveRelative'>
export type MoveToAddressableAreaForDropTipArgs =
  RuntimeParameterArgs<'moveToAddressableAreaForDropTip'>
export type MoveToCoordinatesArgs = RuntimeParameterArgs<'moveToCoordinates'>
export type MoveToWellArgs = RuntimeParameterArgs<'moveToWell'>
export type PrepareToAspirateArgs = RuntimeParameterArgs<'prepareToAspirate'>
export type TryLiquidProbeArgs = RuntimeParameterArgs<'tryLiquidProbe'>
export interface VerifyTipPresenceArgs extends OpentronsAIBaseArgs<'verifyTipPresence'> {}
export type HeaterShakerCloseLabwareLatchArgs =
  RuntimeParameterArgs<'heaterShaker/closeLabwareLatch'>
export type HeaterShakerSetAndWaitForShakeSpeedArgs =
  RuntimeParameterArgs<'heaterShaker/setAndWaitForShakeSpeed'>
export type HeaterShakerDeactiveHeaterArgs =
  RuntimeParameterArgs<'heaterShaker/deactivateHeater'>
export type HeaterShakerOpenLabwareLatchArgs =
  RuntimeParameterArgs<'heaterShaker/openLabwareLatch'>
export type HeaterShakerDeactivateShakerArgs =
  RuntimeParameterArgs<'heaterShaker/deactivateShaker'>
export type TCSetTargetBlockTemperatureArgs =
  RuntimeParameterArgs<'thermocycler/setTargetBlockTemperature'>
export type TCSetTargetLidTemperatureArgs =
  RuntimeParameterArgs<'thermocycler/setTargetLidTemperature'>
export type TCOpenLidArgs = RuntimeParameterArgs<'thermocycler/openLid'>
export type TCCloseLidArgs = RuntimeParameterArgs<'thermocycler/closeLid'>
export type TCDeactivateBlockArgs =
  RuntimeParameterArgs<'thermocycler/deactivateBlock'>
export type TCDeactivateLidArgs =
  RuntimeParameterArgs<'thermocycler/deactivateLid'>
export type TCStartRunExtendedProfileArgs =
  RuntimeParameterArgs<'thermocycler/startRunExtendedProfile'>

// the following args have additional args in the commandCreators
// which are needed for the timeline errors
// tht don't match the command's params
export interface DispenseArgs extends CommonArgs {
  commandCreatorFnName: 'dispense'
  pipetteId: string
  volume: number
  labwareId: string
  wellName: string
  flowRate: number
  tipRack: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzles: NozzleConfigurationStyle
  pushOut?: number
  wellLocation?: WellLocation
  isAirGap?: boolean
}

export type DropTipArgs = WithRuntimeParameterStrings<
  CommonArgs & {
    commandCreatorFnName: 'dropTip'
    pipette: string
    dropTipLocation?: string
    wellName?: string
    isReturnTip?: boolean
  }
>

export type MoveToAddressableAreaArgs = WithRuntimeParameterStrings<
  CommonArgs & {
    commandCreatorFnName: 'moveToAddressableArea'
    pipetteId: string
    fixtureId: string
    offset: AddressableOffsetVector
  }
>

export type PickUpTipArgs = WithRuntimeParameterStrings<
  CommonArgs & {
    commandCreatorFnName: 'pickUpTip'
    pipetteId: string
    labwareId: string
    wellName: string
    primaryNozzle: PrimaryNozzleConfigurationStyle
    nozzles: NozzleConfigurationStyle
    tipTrackingOption?: 'automatic' | 'manual'
  }
>

export type TouchTipArgs = WithRuntimeParameterStrings<
  CommonArgs & {
    commandCreatorFnName: 'touchTip'
    pipetteId: string
    labwareId: string
    wellName: string
    zOffsetFromTop: number
    speed?: number
    mmFromEdge?: number
  }
>

export type OpentronsAIArgs =
  | AirGapInPlaceArgs
  | AspirateArgs
  | AspirateInPlaceArgs
  | AspirateWhileTrackingArgs
  | BlowOutInPlaceArgs
  | BlowoutArgs
  | ConfigureForVolumeArgs
  | ConfigureNozzleLayoutArgs
  | DispenseArgs
  | DispenseInPlaceArgs
  | DispenseWhileTrackingArgs
  | DropTipArgs
  | DropTipInPlaceArgs
  | HomeArgs
  | MoveRelativeArgs
  | MoveToAddressableAreaArgs
  | MoveToAddressableAreaForDropTipArgs
  | MoveToCoordinatesArgs
  | MoveToWellArgs
  | PickUpTipArgs
  | PrepareToAspirateArgs
  | TouchTipArgs
  | TryLiquidProbeArgs
  | HeaterShakerCloseLabwareLatchArgs
  | HeaterShakerSetAndWaitForShakeSpeedArgs
  | HeaterShakerOpenLabwareLatchArgs
  | HeaterShakerDeactiveHeaterArgs
  | HeaterShakerDeactivateShakerArgs
  | TCSetTargetBlockTemperatureArgs
  | TCSetTargetLidTemperatureArgs
  | TCCloseLidArgs
  | TCDeactivateBlockArgs
  | TCDeactivateLidArgs
  | TCOpenLidArgs
  | TCStartRunExtendedProfileArgs
