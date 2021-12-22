import { CommonCommandInfo } from '.'

export type ModuleCommand =
  | MagneticModuleEngageMagnetCommand
  | MagneticModuleDisengageMagnetCommand
  | TemperatureModuleSetTargetTemperatureCommand
  | TemperatureModuleDeactivateCommand
  | TemperatureModuleAwaitTemperatureCommand
  | TCSetTargetBlockTemperatureCommand
  | TCSetTargetLidTemperatureCommand
  | TCAwaitBlockTemperatureCommand
  | TCAwaitLidTemperatureCommand
  | TCOpenLidCommand
  | TCCloseLidCommand
  | TCDeactivateBlockCommand
  | TCDeactivateLidCommand
  | TCRunProfileCommand
  | TCAwaitProfileCompleteCommand
  | HeaterShakerSetTargetTemperatureCommand
  | HeaterShakerAwaitTemperatureCommand
  | HeaterShakerSetTargetShakeSpeedCommand
  | HeaterShakerAwaitShakeSpeedCommand
  | HeaterShakerDeactivateHeaterCommand

export type ModuleCreateCommand =
  | MagneticModuleEngageMagnetCreateCommand
  | MagneticModuleDisengageMagnetCreateCommand
  | TemperatureModuleSetTargetTemperatureCreateCommand
  | TemperatureModuleDeactivateCreateCommand
  | TemperatureModuleAwaitTemperatureCreateCommand
  | TCSetTargetBlockTemperatureCreateCommand
  | TCSetTargetLidTemperatureCreateCommand
  | TCAwaitBlockTemperatureCreateCommand
  | TCAwaitLidTemperatureCreateCommand
  | TCOpenLidCreateCommand
  | TCCloseLidCreateCommand
  | TCDeactivateBlockCreateCommand
  | TCDeactivateLidCreateCommand
  | TCRunProfileCreateCommand
  | TCAwaitProfileCompleteCreateCommand
  | HeaterShakerSetTargetTemperatureCreateCommand
  | HeaterShakerAwaitTemperatureCreateCommand
  | HeaterShakerSetTargetShakeSpeedCreateCommand
  | HeaterShakerAwaitShakeSpeedCreateCommand
  | HeaterShakerDeactivateHeaterCreateCommand

export interface MagneticModuleEngageMagnetCreateCommand
  extends CommonCommandInfo {
  commandType: 'magneticModule/engageMagnet'
  params: EngageMagnetParams
  result?: any
}
export interface MagneticModuleEngageMagnetCommand
  extends MagneticModuleEngageMagnetCreateCommand {
  key: string
}
export interface MagneticModuleDisengageMagnetCreateCommand
  extends CommonCommandInfo {
  commandType: 'magneticModule/disengageMagnet'
  params: ModuleOnlyParams
  result?: any
}
export interface MagneticModuleDisengageMagnetCommand
  extends MagneticModuleDisengageMagnetCreateCommand {
  key: string
}
export interface TemperatureModuleSetTargetTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
  result?: any
}
export interface TemperatureModuleSetTargetTemperatureCommand
  extends TemperatureModuleSetTargetTemperatureCreateCommand {
  key: string
}
export interface TemperatureModuleDeactivateCreateCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
  result?: any
}
export interface TemperatureModuleDeactivateCommand
  extends TemperatureModuleDeactivateCreateCommand {
  key: string
}
export interface TemperatureModuleAwaitTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/awaitTemperature'
  params: TemperatureParams
  result?: any
}
export interface TemperatureModuleAwaitTemperatureCommand
  extends TemperatureModuleAwaitTemperatureCreateCommand {
  key: string
}
export interface TCSetTargetBlockTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
  result?: any
}
export interface TCSetTargetBlockTemperatureCommand
  extends TCSetTargetBlockTemperatureCreateCommand {
  key: string
}
export interface TCSetTargetLidTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCSetTargetLidTemperatureCommand
  extends TCSetTargetLidTemperatureCreateCommand {
  key: string
}
export interface TCAwaitBlockTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'thermocycler/awaitBlockTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCAwaitBlockTemperatureCommand
  extends TCAwaitBlockTemperatureCreateCommand {
  key: string
}
export interface TCAwaitLidTemperatureCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitLidTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCAwaitLidTemperatureCommand
  extends TCAwaitLidTemperatureCreateCommand {
  key: string
}
export interface TCOpenLidCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCOpenLidCommand extends TCOpenLidCreateCommand {
  key: string
}
export interface TCCloseLidCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCCloseLidCommand extends TCCloseLidCreateCommand {
  key: string
}
export interface TCDeactivateBlockCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
  result?: any
}
export interface TCDeactivateBlockCommand
  extends TCDeactivateBlockCreateCommand {
  key: string
}
export interface TCDeactivateLidCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCDeactivateLidCommand extends TCDeactivateLidCreateCommand {
  key: string
}
export interface TCRunProfileCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
  result?: any
}
export interface TCRunProfileCommand extends TCRunProfileCreateCommand {
  key: string
}
export interface TCAwaitProfileCompleteCreateCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
  result?: any
}
export interface TCAwaitProfileCompleteCommand
  extends TCAwaitProfileCompleteCreateCommand {
  key: string
}
export interface HeaterShakerSetTargetTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
  result?: any
}
export interface HeaterShakerSetTargetTemperatureCommand
  extends HeaterShakerSetTargetTemperatureCreateCommand {
  key: string
}
export interface HeaterShakerAwaitTemperatureCreateCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/awaitTemperature'
  params: TemperatureParams
  result?: any
}
export interface HeaterShakerAwaitTemperatureCommand
  extends HeaterShakerAwaitTemperatureCreateCommand {
  key: string
}
export interface HeaterShakerSetTargetShakeSpeedCreateCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/setTargetShakeSpeed'
  params: ShakeSpeedParams
  result?: any
}
export interface HeaterShakerSetTargetShakeSpeedCommand
  extends HeaterShakerSetTargetShakeSpeedCreateCommand {
  key: string
}
export interface HeaterShakerAwaitShakeSpeedCreateCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/awaitShakeSpeed'
  params: ShakeSpeedParams
  result?: any
}
export interface HeaterShakerAwaitShakeSpeedCommand
  extends HeaterShakerAwaitShakeSpeedCreateCommand {
  key: string
}
export interface HeaterShakerDeactivateHeaterCreateCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
  result?: any
}
export interface HeaterShakerDeactivateHeaterCommand
  extends HeaterShakerDeactivateHeaterCreateCommand {
  key: string
}

export interface EngageMagnetParams {
  moduleId: string
  engageHeight: number
}

export interface TemperatureParams {
  moduleId: string
  temperature: number
}
export interface ShakeSpeedParams {
  moduleId: string
  rpm: number
}

export interface AtomicProfileStep {
  holdTime: number
  temperature: number
}

export interface TCProfileParams {
  moduleId: string
  profile: AtomicProfileStep[]
  volume: number
}

export interface ModuleOnlyParams {
  moduleId: string
}

export interface ThermocyclerSetTargetBlockTemperatureParams {
  moduleId: string
  temperature: number
  volume?: number
}
