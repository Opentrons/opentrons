// Opentrons AI command args — protocol commandTypes are listed in opentronsAICommandTypes.ts
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

export interface AbsorbanceReaderCloseLidArgs extends OpentronsAIBaseArgs<'absorbanceReader/closeLid'> {}
export interface AbsorbanceReaderOpenLidArgs extends OpentronsAIBaseArgs<'absorbanceReader/openLid'> {}
export interface AirGapInPlaceArgs extends OpentronsAIBaseArgs<'airGapInPlace'> {}
export interface AspirateArgs extends OpentronsAIBaseArgs<'aspirate'> {}
export interface AspirateInPlaceArgs extends OpentronsAIBaseArgs<'aspirateInPlace'> {}
export interface AspirateWhileTrackingArgs extends OpentronsAIBaseArgs<'aspirateWhileTracking'> {}
export interface BlowOutInPlaceArgs extends OpentronsAIBaseArgs<'blowOutInPlace'> {}
export interface BlowoutArgs extends OpentronsAIBaseArgs<'blowout'> {}
export interface ConfigureForVolumeArgs extends OpentronsAIBaseArgs<'configureForVolume'> {}
export interface ConfigureNozzleLayoutArgs extends OpentronsAIBaseArgs<'configureNozzleLayout'> {}
export interface CreateTimerArgs extends OpentronsAIBaseArgs<'createTimer'> {}
export interface CustomArgs extends OpentronsAIBaseArgs<'custom'> {}
export interface DispenseArgs extends OpentronsAIBaseArgs<'dispense'> {}
export interface DispenseInPlaceArgs extends OpentronsAIBaseArgs<'dispenseInPlace'> {}
export interface DispenseWhileTrackingArgs extends OpentronsAIBaseArgs<'dispenseWhileTracking'> {}
export interface DropTipArgs extends OpentronsAIBaseArgs<'dropTip'> {}
export interface DropTipInPlaceArgs extends OpentronsAIBaseArgs<'dropTipInPlace'> {}
export interface FlexStackerFillArgs extends OpentronsAIBaseArgs<'flexStacker/fill'> {}
export interface FlexStackerSetStoredLabwareArgs extends OpentronsAIBaseArgs<'flexStacker/setStoredLabware'> {}
export interface HeaterShakerCloseLabwareLatchArgs extends OpentronsAIBaseArgs<'heaterShaker/closeLabwareLatch'> {}
export interface HeaterShakerDeactivateHeaterArgs extends OpentronsAIBaseArgs<'heaterShaker/deactivateHeater'> {}
export interface HeaterShakerDeactivateShakerArgs extends OpentronsAIBaseArgs<'heaterShaker/deactivateShaker'> {}
export interface HeaterShakerOpenLabwareLatchArgs extends OpentronsAIBaseArgs<'heaterShaker/openLabwareLatch'> {}
export interface HeaterShakerSetAndWaitForShakeSpeedArgs extends OpentronsAIBaseArgs<'heaterShaker/setAndWaitForShakeSpeed'> {}
export interface HeaterShakerSetShakeSpeedArgs extends OpentronsAIBaseArgs<'heaterShaker/setShakeSpeed'> {}
export interface HeaterShakerSetTargetTemperatureArgs extends OpentronsAIBaseArgs<'heaterShaker/setTargetTemperature'> {}
export interface HeaterShakerWaitForTemperatureArgs extends OpentronsAIBaseArgs<'heaterShaker/waitForTemperature'> {}
export interface HomeArgs extends OpentronsAIBaseArgs<'home'> {}
export interface MagneticModuleDisengageArgs extends OpentronsAIBaseArgs<'magneticModule/disengage'> {}
export interface MagneticModuleEngageArgs extends OpentronsAIBaseArgs<'magneticModule/engage'> {}
export interface MoveRelativeArgs extends OpentronsAIBaseArgs<'moveRelative'> {}
export interface MoveToAddressableAreaArgs extends OpentronsAIBaseArgs<'moveToAddressableArea'> {}
export interface MoveToAddressableAreaForDropTipArgs extends OpentronsAIBaseArgs<'moveToAddressableAreaForDropTip'> {}
export interface MoveToCoordinatesArgs extends OpentronsAIBaseArgs<'moveToCoordinates'> {}
export interface MoveToWellArgs extends OpentronsAIBaseArgs<'moveToWell'> {}
export interface PickUpTipArgs extends OpentronsAIBaseArgs<'pickUpTip'> {}
export interface PrepareToAspirateArgs extends OpentronsAIBaseArgs<'prepareToAspirate'> {}
export interface SavePositionArgs extends OpentronsAIBaseArgs<'savePosition'> {}
export interface TemperatureModuleDeactivateArgs extends OpentronsAIBaseArgs<'temperatureModule/deactivate'> {}
export interface TemperatureModuleSetTargetTemperatureArgs extends OpentronsAIBaseArgs<'temperatureModule/setTargetTemperature'> {}
export interface TemperatureModuleWaitForTemperatureArgs extends OpentronsAIBaseArgs<'temperatureModule/waitForTemperature'> {}
export interface ThermocyclerCloseLidArgs extends OpentronsAIBaseArgs<'thermocycler/closeLid'> {}
export interface ThermocyclerDeactivateBlockArgs extends OpentronsAIBaseArgs<'thermocycler/deactivateBlock'> {}
export interface ThermocyclerDeactivateLidArgs extends OpentronsAIBaseArgs<'thermocycler/deactivateLid'> {}
export interface ThermocyclerOpenLidArgs extends OpentronsAIBaseArgs<'thermocycler/openLid'> {}
export interface ThermocyclerRunExtendedProfileArgs extends OpentronsAIBaseArgs<'thermocycler/runExtendedProfile'> {}
export interface ThermocyclerRunProfileArgs extends OpentronsAIBaseArgs<'thermocycler/runProfile'> {}
export interface ThermocyclerSetTargetBlockTemperatureArgs extends OpentronsAIBaseArgs<'thermocycler/setTargetBlockTemperature'> {}
export interface ThermocyclerSetTargetLidTemperatureArgs extends OpentronsAIBaseArgs<'thermocycler/setTargetLidTemperature'> {}
export interface ThermocyclerStartRunExtendedProfileArgs extends OpentronsAIBaseArgs<'thermocycler/startRunExtendedProfile'> {}
export interface ThermocyclerWaitForBlockTemperatureArgs extends OpentronsAIBaseArgs<'thermocycler/waitForBlockTemperature'> {}
export interface ThermocyclerWaitForLidTemperatureArgs extends OpentronsAIBaseArgs<'thermocycler/waitForLidTemperature'> {}
export interface TouchTipArgs extends OpentronsAIBaseArgs<'touchTip'> {}
export interface VacuumModuleCloseVentArgs extends OpentronsAIBaseArgs<'vacuumModule/closeVent'> {}
export interface VacuumModuleOpenVentArgs extends OpentronsAIBaseArgs<'vacuumModule/openVent'> {}
export interface VacuumModuleStartRunProfileArgs extends OpentronsAIBaseArgs<'vacuumModule/startRunProfile'> {}
export interface VacuumModuleStartSetVacuumPowerArgs extends OpentronsAIBaseArgs<'vacuumModule/startSetVacuumPower'> {}
export interface VacuumModuleStartSetVacuumPressureArgs extends OpentronsAIBaseArgs<'vacuumModule/startSetVacuumPressure'> {}
export interface VacuumModuleStopVacuumArgs extends OpentronsAIBaseArgs<'vacuumModule/stopVacuum'> {}
export interface WaitForDurationArgs extends OpentronsAIBaseArgs<'waitForDuration'> {}
export interface WaitForTasksArgs extends OpentronsAIBaseArgs<'waitForTasks'> {}

export type OpentronsAIArgs =
  | AbsorbanceReaderCloseLidArgs
  | AbsorbanceReaderOpenLidArgs
  | AirGapInPlaceArgs
  | AspirateArgs
  | AspirateInPlaceArgs
  | AspirateWhileTrackingArgs
  | BlowOutInPlaceArgs
  | BlowoutArgs
  | ConfigureForVolumeArgs
  | ConfigureNozzleLayoutArgs
  | CreateTimerArgs
  | CustomArgs
  | DispenseArgs
  | DispenseInPlaceArgs
  | DispenseWhileTrackingArgs
  | DropTipArgs
  | DropTipInPlaceArgs
  | FlexStackerFillArgs
  | FlexStackerSetStoredLabwareArgs
  | HeaterShakerCloseLabwareLatchArgs
  | HeaterShakerDeactivateHeaterArgs
  | HeaterShakerDeactivateShakerArgs
  | HeaterShakerOpenLabwareLatchArgs
  | HeaterShakerSetAndWaitForShakeSpeedArgs
  | HeaterShakerSetShakeSpeedArgs
  | HeaterShakerSetTargetTemperatureArgs
  | HeaterShakerWaitForTemperatureArgs
  | HomeArgs
  | MagneticModuleDisengageArgs
  | MagneticModuleEngageArgs
  | MoveRelativeArgs
  | MoveToAddressableAreaArgs
  | MoveToAddressableAreaForDropTipArgs
  | MoveToCoordinatesArgs
  | MoveToWellArgs
  | PickUpTipArgs
  | PrepareToAspirateArgs
  | SavePositionArgs
  | TemperatureModuleDeactivateArgs
  | TemperatureModuleSetTargetTemperatureArgs
  | TemperatureModuleWaitForTemperatureArgs
  | ThermocyclerCloseLidArgs
  | ThermocyclerDeactivateBlockArgs
  | ThermocyclerDeactivateLidArgs
  | ThermocyclerOpenLidArgs
  | ThermocyclerRunExtendedProfileArgs
  | ThermocyclerRunProfileArgs
  | ThermocyclerSetTargetBlockTemperatureArgs
  | ThermocyclerSetTargetLidTemperatureArgs
  | ThermocyclerStartRunExtendedProfileArgs
  | ThermocyclerWaitForBlockTemperatureArgs
  | ThermocyclerWaitForLidTemperatureArgs
  | TouchTipArgs
  | VacuumModuleCloseVentArgs
  | VacuumModuleOpenVentArgs
  | VacuumModuleStartRunProfileArgs
  | VacuumModuleStartSetVacuumPowerArgs
  | VacuumModuleStartSetVacuumPressureArgs
  | VacuumModuleStopVacuumArgs
  | WaitForDurationArgs
  | WaitForTasksArgs
