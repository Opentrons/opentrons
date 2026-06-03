// Opentrons AI command args
// params are sourced from CreateCommand where available.

import type { CreateCommand } from '../../protocol'
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
export interface CustomArgs extends OpentronsAIBaseArgs<'custom'> {}
export interface DispenseArgs extends OpentronsAIBaseArgs<'dispense'> {}
export interface DispenseInPlaceArgs extends OpentronsAIBaseArgs<'dispenseInPlace'> {}
export interface DispenseWhileTrackingArgs extends OpentronsAIBaseArgs<'dispenseWhileTracking'> {}
export interface DropTipArgs extends OpentronsAIBaseArgs<'dropTip'> {}
export interface DropTipInPlaceArgs extends OpentronsAIBaseArgs<'dropTipInPlace'> {}
export interface HomeArgs extends OpentronsAIBaseArgs<'home'> {}
export interface MoveRelativeArgs extends OpentronsAIBaseArgs<'moveRelative'> {}
export interface MoveToAddressableAreaArgs extends OpentronsAIBaseArgs<'moveToAddressableArea'> {}
export interface MoveToAddressableAreaForDropTipArgs extends OpentronsAIBaseArgs<'moveToAddressableAreaForDropTip'> {}
export interface MoveToCoordinatesArgs extends OpentronsAIBaseArgs<'moveToCoordinates'> {}
export interface MoveToWellArgs extends OpentronsAIBaseArgs<'moveToWell'> {}
export interface PickUpTipArgs extends OpentronsAIBaseArgs<'pickUpTip'> {}
export interface PrepareToAspirateArgs extends OpentronsAIBaseArgs<'prepareToAspirate'> {}
export interface SavePositionArgs extends OpentronsAIBaseArgs<'savePosition'> {}
export interface TouchTipArgs extends OpentronsAIBaseArgs<'touchTip'> {}
export interface TryLiquidProbeArgs extends OpentronsAIBaseArgs<'tryLiquidProbe'> {}
export interface VerifyTipPresenceArgs extends OpentronsAIBaseArgs<'verifyTipPresence'> {}

export type OpentronsAIArgs =
  | AirGapInPlaceArgs
  | AspirateArgs
  | AspirateInPlaceArgs
  | AspirateWhileTrackingArgs
  | BlowOutInPlaceArgs
  | BlowoutArgs
  | ConfigureForVolumeArgs
  | ConfigureNozzleLayoutArgs
  | CustomArgs
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
  | SavePositionArgs
  | TouchTipArgs
  | TryLiquidProbeArgs
