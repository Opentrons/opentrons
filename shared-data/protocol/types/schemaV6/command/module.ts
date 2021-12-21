import { CommonCommandInfo, CommonCreateCommandInfo } from '.'

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

export interface MagneticModuleEngageMagnetCommand extends CommonCommandInfo {
  commandType: 'magneticModule/engageMagnet'
  params: EngageMagnetParams
  result?: any
}
export interface MagneticModuleEngageMagnetCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'magneticModule/engageMagnet'
  params: EngageMagnetParams
  result?: any
}
export interface MagneticModuleDisengageMagnetCommand
  extends CommonCommandInfo {
  commandType: 'magneticModule/disengageMagnet'
  params: ModuleOnlyParams
  result?: any
}
export interface MagneticModuleDisengageMagnetCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'magneticModule/disengageMagnet'
  params: ModuleOnlyParams
  result?: any
}
export interface TemperatureModuleSetTargetTemperatureCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
  result?: any
}
export interface TemperatureModuleSetTargetTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
  result?: any
}
export interface TemperatureModuleDeactivateCommand extends CommonCommandInfo {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
  result?: any
}
export interface TemperatureModuleDeactivateCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
  result?: any
}
export interface TemperatureModuleAwaitTemperatureCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/awaitTemperature'
  params: TemperatureParams
  result?: any
}
export interface TemperatureModuleAwaitTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'temperatureModule/awaitTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCSetTargetBlockTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
  result?: any
}
export interface TCSetTargetBlockTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
  result?: any
}
export interface TCSetTargetLidTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCSetTargetLidTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCAwaitBlockTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitBlockTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCAwaitBlockTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'thermocycler/awaitBlockTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCAwaitLidTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitLidTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCAwaitLidTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'thermocycler/awaitLidTemperature'
  params: TemperatureParams
  result?: any
}
export interface TCOpenLidCommand extends CommonCommandInfo {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCOpenLidCreateCommand extends CommonCreateCommandInfo {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCCloseLidCommand extends CommonCommandInfo {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCCloseLidCreateCommand extends CommonCreateCommandInfo {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCDeactivateBlockCommand extends CommonCommandInfo {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
  result?: any
}
export interface TCDeactivateBlockCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
  result?: any
}
export interface TCDeactivateLidCommand extends CommonCommandInfo {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCDeactivateLidCreateCommand extends CommonCreateCommandInfo {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
  result?: any
}
export interface TCRunProfileCommand extends CommonCommandInfo {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
  result?: any
}
export interface TCRunProfileCreateCommand extends CommonCreateCommandInfo {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
  result?: any
}
export interface TCAwaitProfileCompleteCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
  result?: any
}
export interface TCAwaitProfileCompleteCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
  result?: any
}
export interface HeaterShakerSetTargetTemperatureCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
  result?: any
}
export interface HeaterShakerSetTargetTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
  result?: any
}
export interface HeaterShakerAwaitTemperatureCommand extends CommonCommandInfo {
  commandType: 'heaterShaker/awaitTemperature'
  params: TemperatureParams
  result?: any
}
export interface HeaterShakerAwaitTemperatureCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'heaterShaker/awaitTemperature'
  params: TemperatureParams
  result?: any
}
export interface HeaterShakerSetTargetShakeSpeedCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/setTargetShakeSpeed'
  params: ShakeSpeedParams
  result?: any
}
export interface HeaterShakerSetTargetShakeSpeedCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'heaterShaker/setTargetShakeSpeed'
  params: ShakeSpeedParams
  result?: any
}
export interface HeaterShakerAwaitShakeSpeedCommand extends CommonCommandInfo {
  commandType: 'heaterShaker/awaitShakeSpeed'
  params: ShakeSpeedParams
  result?: any
}
export interface HeaterShakerAwaitShakeSpeedCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'heaterShaker/awaitShakeSpeed'
  params: ShakeSpeedParams
  result?: any
}
export interface HeaterShakerDeactivateHeaterCommand extends CommonCommandInfo {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
  result?: any
}
export interface HeaterShakerDeactivateHeaterCreateCommand
  extends CommonCreateCommandInfo {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
  result?: any
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
