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

export interface AirGapInPlaceArgs extends OpentronsAIBaseArgs<'airGapInPlace'> {}
export interface AspirateArgs extends OpentronsAIBaseArgs<'aspirate'> {}
export interface AspirateInPlaceArgs extends OpentronsAIBaseArgs<'aspirateInPlace'> {}
export interface AspirateWhileTrackingArgs extends OpentronsAIBaseArgs<'aspirateWhileTracking'> {}
export interface BlowOutInPlaceArgs extends OpentronsAIBaseArgs<'blowOutInPlace'> {}
export interface BlowoutArgs extends OpentronsAIBaseArgs<'blowout'> {}
export interface ConfigureForVolumeArgs extends OpentronsAIBaseArgs<'configureForVolume'> {}
export interface ConfigureNozzleLayoutArgs extends OpentronsAIBaseArgs<'configureNozzleLayout'> {}
export interface DispenseInPlaceArgs extends OpentronsAIBaseArgs<'dispenseInPlace'> {}
export interface DispenseWhileTrackingArgs extends OpentronsAIBaseArgs<'dispenseWhileTracking'> {}
export interface DropTipInPlaceArgs extends OpentronsAIBaseArgs<'dropTipInPlace'> {}
export interface HomeArgs extends OpentronsAIBaseArgs<'home'> {}
export interface MoveRelativeArgs extends OpentronsAIBaseArgs<'moveRelative'> {}
export interface MoveToAddressableAreaForDropTipArgs extends OpentronsAIBaseArgs<'moveToAddressableAreaForDropTip'> {}
export interface MoveToCoordinatesArgs extends OpentronsAIBaseArgs<'moveToCoordinates'> {}
export interface MoveToWellArgs extends OpentronsAIBaseArgs<'moveToWell'> {}
export interface PrepareToAspirateArgs extends OpentronsAIBaseArgs<'prepareToAspirate'> {}
export interface TryLiquidProbeArgs extends OpentronsAIBaseArgs<'tryLiquidProbe'> {}
export interface VerifyTipPresenceArgs extends OpentronsAIBaseArgs<'verifyTipPresence'> {}
export interface HeaterShakerCloseLabwareLatchArgs extends OpentronsAIBaseArgs<'heaterShaker/closeLabwareLatch'> {}
export interface HeaterShakerSetAndWaitForShakeSpeedArgs extends OpentronsAIBaseArgs<'heaterShaker/setAndWaitForShakeSpeed'> {}
export interface HeaterShakerDeactiveHeaterArgs extends OpentronsAIBaseArgs<'heaterShaker/deactivateHeater'> {}
export interface HeaterShakerOpenLabwareLatchArgs extends OpentronsAIBaseArgs<'heaterShaker/openLabwareLatch'> {}
export interface HeaterShakerDeactivateShakerArgs extends OpentronsAIBaseArgs<'heaterShaker/deactivateShaker'> {}
export interface TCSetTargetBlockTemperatureArgs extends OpentronsAIBaseArgs<'thermocycler/setTargetBlockTemperature'> {}
export interface TCSetTargetLidTemperatureArgs extends OpentronsAIBaseArgs<'thermocycler/setTargetLidTemperature'> {}
export interface TCOpenLidArgs extends OpentronsAIBaseArgs<'thermocycler/openLid'> {}
export interface TCCloseLidArgs extends OpentronsAIBaseArgs<'thermocycler/closeLid'> {}
export interface TCDeactivateBlockArgs extends OpentronsAIBaseArgs<'thermocycler/deactivateBlock'> {}
export interface TCDeactivateLidArgs extends OpentronsAIBaseArgs<'thermocycler/deactivateLid'> {}
export interface TCStartRunExtendedProfileArgs extends OpentronsAIBaseArgs<'thermocycler/startRunExtendedProfile'> {}

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

export interface DropTipArgs extends CommonArgs {
  commandCreatorFnName: 'dropTip'
  pipette: string
  dropTipLocation?: string
  wellName?: string
  isReturnTip?: boolean
}

export interface MoveToAddressableAreaArgs extends CommonArgs {
  commandCreatorFnName: 'moveToAddressableArea'
  pipetteId: string
  fixtureId: string
  offset: AddressableOffsetVector
}

export interface PickUpTipArgs extends CommonArgs {
  commandCreatorFnName: 'pickUpTip'
  pipetteId: string
  labwareId: string
  wellName: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzles: NozzleConfigurationStyle
  tipTrackingOption?: 'automatic' | 'manual'
}

export interface TouchTipArgs extends CommonArgs {
  commandCreatorFnName: 'touchTip'
  pipetteId: string
  labwareId: string
  wellName: string
  zOffsetFromTop: number
  speed?: number
  mmFromEdge?: number
}

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
