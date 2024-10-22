import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'

export type ModuleRunTimeCommand =
  | MagneticModuleEngageMagnetRunTimeCommand
  | MagneticModuleDisengageRunTimeCommand
  | TemperatureModuleSetTargetTemperatureRunTimeCommand
  | TemperatureModuleDeactivateRunTimeCommand
  | TemperatureModuleAwaitTemperatureRunTimeCommand
  | TCSetTargetBlockTemperatureRunTimeCommand
  | TCSetTargetLidTemperatureRunTimeCommand
  | TCWaitForBlockTemperatureRunTimeCommand
  | TCWaitForLidTemperatureRunTimeCommand
  | TCOpenLidRunTimeCommand
  | TCCloseLidRunTimeCommand
  | TCDeactivateBlockRunTimeCommand
  | TCDeactivateLidRunTimeCommand
  | TCRunProfileRunTimeCommand
  | TCRunExtendedProfileRunTimeCommand
  | TCAwaitProfileCompleteRunTimeCommand
  | HeaterShakerSetTargetTemperatureRunTimeCommand
  | HeaterShakerWaitForTemperatureRunTimeCommand
  | HeaterShakerSetAndWaitForShakeSpeedRunTimeCommand
  | HeaterShakerOpenLatchRunTimeCommand
  | HeaterShakerCloseLatchRunTimeCommand
  | HeaterShakerDeactivateHeaterRunTimeCommand
  | HeaterShakerDeactivateShakerRunTimeCommand
  | AbsorbanceReaderOpenLidRunTimeCommand
  | AbsorbanceReaderCloseLidRunTimeCommand
  | AbsorbanceReaderInitializeRunTimeCommand
  | AbsorbanceReaderReadRunTimeCommand

export type ModuleCreateCommand =
  | MagneticModuleEngageMagnetCreateCommand
  | MagneticModuleDisengageCreateCommand
  | TemperatureModuleSetTargetTemperatureCreateCommand
  | TemperatureModuleDeactivateCreateCommand
  | TemperatureModuleAwaitTemperatureCreateCommand
  | TCSetTargetBlockTemperatureCreateCommand
  | TCSetTargetLidTemperatureCreateCommand
  | TCWaitForBlockTemperatureCreateCommand
  | TCWaitForLidTemperatureCreateCommand
  | TCOpenLidCreateCommand
  | TCCloseLidCreateCommand
  | TCDeactivateBlockCreateCommand
  | TCDeactivateLidCreateCommand
  | TCRunProfileCreateCommand
  | TCRunExtendedProfileCreateCommand
  | TCAwaitProfileCompleteCreateCommand
  | HeaterShakerWaitForTemperatureCreateCommand
  | HeaterShakerSetAndWaitForShakeSpeedCreateCommand
  | HeaterShakerOpenLatchCreateCommand
  | HeaterShakerCloseLatchCreateCommand
  | HeaterShakerDeactivateHeaterCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerSetTargetTemperatureCreateCommand
  | AbsorbanceReaderOpenLidCreateCommand
  | AbsorbanceReaderCloseLidCreateCommand
  | AbsorbanceReaderInitializeCreateCommand
  | AbsorbanceReaderReadCreateCommand

export interface MagneticModuleEngageMagnetCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'magneticModule/engage'
  params: EngageMagnetParams
}
export interface MagneticModuleEngageMagnetRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MagneticModuleEngageMagnetCreateCommand {
  result?: any
}
export interface MagneticModuleDisengageCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'magneticModule/disengage'
  params: ModuleOnlyParams
}
export interface MagneticModuleDisengageRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MagneticModuleDisengageCreateCommand {
  result?: any
}
export interface TemperatureModuleSetTargetTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
}
export interface TemperatureModuleSetTargetTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TemperatureModuleSetTargetTemperatureCreateCommand {
  result?: any
}
export interface TemperatureModuleDeactivateCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
}
export interface TemperatureModuleDeactivateRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TemperatureModuleDeactivateCreateCommand {
  result?: any
}
export interface TemperatureModuleAwaitTemperatureParams {
  // same params as TemperatureParams except celsius is optional
  moduleId: string
  celsius?: number
}
export interface TemperatureModuleAwaitTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'temperatureModule/waitForTemperature'
  params: TemperatureModuleAwaitTemperatureParams
}
export interface TemperatureModuleAwaitTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TemperatureModuleAwaitTemperatureCreateCommand {
  result?: any
}
export interface TCSetTargetBlockTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
}
export interface TCSetTargetBlockTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCSetTargetBlockTemperatureCreateCommand {
  result?: any
}
export interface TCSetTargetLidTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
}
export interface TCSetTargetLidTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCSetTargetLidTemperatureCreateCommand {
  result?: any
}
export interface TCWaitForBlockTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/waitForBlockTemperature'
  params: ModuleOnlyParams
}
export interface TCWaitForBlockTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCWaitForBlockTemperatureCreateCommand {
  result?: any
}
export interface TCWaitForLidTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/waitForLidTemperature'
  params: ModuleOnlyParams
}
export interface TCWaitForLidTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCWaitForLidTemperatureCreateCommand {
  result?: any
}
export interface TCOpenLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
}
export interface TCOpenLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCOpenLidCreateCommand {
  result?: any
}
export interface TCCloseLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
}
export interface TCCloseLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCCloseLidCreateCommand {
  result?: any
}
export interface TCDeactivateBlockCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
}
export interface TCDeactivateBlockRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCDeactivateBlockCreateCommand {
  result?: any
}
export interface TCDeactivateLidCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
}
export interface TCDeactivateLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCDeactivateLidCreateCommand {
  result?: any
}
export interface TCRunProfileCreateCommand extends CommonCommandCreateInfo {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
}
export interface TCRunProfileRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCRunProfileCreateCommand {
  result?: any
}
export interface TCRunExtendedProfileCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/runExtendedProfile'
  params: TCExtendedProfileParams
}
export interface TCRunExtendedProfileRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCRunExtendedProfileCreateCommand {
  result?: any
}
export interface TCAwaitProfileCompleteCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
}
export interface TCAwaitProfileCompleteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCAwaitProfileCompleteCreateCommand {
  result?: any
}
export interface HeaterShakerSetTargetTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
}
export interface HeaterShakerSetTargetTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerSetTargetTemperatureCreateCommand {
  result?: any
}
export interface HeaterShakerWaitForTemperatureCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/waitForTemperature'
  params: ModuleOnlyParams
}
export interface HeaterShakerWaitForTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerWaitForTemperatureCreateCommand {
  result?: any
}
export interface HeaterShakerSetAndWaitForShakeSpeedCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/setAndWaitForShakeSpeed'
  params: ShakeSpeedParams
}
export interface HeaterShakerSetAndWaitForShakeSpeedRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerSetAndWaitForShakeSpeedCreateCommand {
  result?: any
}
export interface HeaterShakerDeactivateHeaterCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
}
export interface HeaterShakerDeactivateHeaterRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerDeactivateHeaterCreateCommand {
  result?: any
}
export interface HeaterShakerOpenLatchCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/openLabwareLatch'
  params: ModuleOnlyParams
}
export interface HeaterShakerOpenLatchRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerOpenLatchCreateCommand {
  result?: any
}
export interface HeaterShakerCloseLatchCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/closeLabwareLatch'
  params: ModuleOnlyParams
}
export interface HeaterShakerCloseLatchRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerCloseLatchCreateCommand {
  result?: any
}
export interface HeaterShakerDeactivateShakerCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'heaterShaker/deactivateShaker'
  params: ModuleOnlyParams
}
export interface HeaterShakerDeactivateShakerRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerDeactivateShakerCreateCommand {
  result?: any
}
export interface AbsorbanceReaderOpenLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AbsorbanceReaderOpenLidCreateCommand {
  result?: any
}
export interface AbsorbanceReaderCloseLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AbsorbanceReaderCloseLidCreateCommand {
  result?: any
}
export interface AbsorbanceReaderInitializeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AbsorbanceReaderInitializeCreateCommand {
  result?: any
}
export interface AbsorbanceReaderReadRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AbsorbanceReaderReadCreateCommand {
  result?: any
}
export interface AbsorbanceReaderOpenLidCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/openLid'
  params: ModuleOnlyParams
}
export interface AbsorbanceReaderCloseLidCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/closeLid'
  params: ModuleOnlyParams
}
export interface AbsorbanceReaderInitializeCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/initialize'
  params: AbsorbanceReaderInitializeParams
}
export interface AbsorbanceReaderReadCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'absorbanceReader/read'
  params: ModuleOnlyParams
}
export interface EngageMagnetParams {
  moduleId: string
  height: number
}
export interface AbsorbanceReaderInitializeParams {
  moduleId: string
  measureMode: 'single' | 'multi'
  sampleWavelengths: number[]
  referenceWavelength?: number
}
export interface TemperatureParams {
  moduleId: string
  celsius: number
}
export interface ShakeSpeedParams {
  moduleId: string
  rpm: number
}

export interface AtomicProfileStep {
  holdSeconds: number
  celsius: number
}

export interface TCProfileParams {
  moduleId: string
  profile: AtomicProfileStep[]
  blockMaxVolumeUl?: number
}

export interface ModuleOnlyParams {
  moduleId: string
}

export interface ThermocyclerSetTargetBlockTemperatureParams {
  moduleId: string
  celsius: number
  volume?: number
  holdTimeSeconds?: number
}

export interface TCProfileCycle {
  steps: AtomicProfileStep[]
  repetitions: number
}

export interface TCExtendedProfileParams {
  moduleId: string
  profileElements: Array<TCProfileCycle | AtomicProfileStep>
  blockMaxVolumeUl?: number
}
