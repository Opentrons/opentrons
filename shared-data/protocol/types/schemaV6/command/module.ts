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

export interface MagneticModuleEngageMagnetCommand extends CommonCommandInfo {
  commandType: 'magneticModule/engageMagnet'
  params: EngageMagnetParams
  result?: {}
}
export interface MagneticModuleDisengageMagnetCommand
  extends CommonCommandInfo {
  commandType: 'magneticModule/disengageMagnet'
  params: ModuleOnlyParams
  result?: {}
}
export interface TemperatureModuleSetTargetTemperatureCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TemperatureModuleDeactivateCommand extends CommonCommandInfo {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
  result?: {}
}
export interface TemperatureModuleAwaitTemperatureCommand
  extends CommonCommandInfo {
  commandType: 'temperatureModule/awaitTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCSetTargetBlockTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
  result?: {}
}
export interface TCSetTargetLidTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCAwaitBlockTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitBlockTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCAwaitLidTemperatureCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitLidTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCOpenLidCommand extends CommonCommandInfo {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCCloseLidCommand extends CommonCommandInfo {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCDeactivateBlockCommand extends CommonCommandInfo {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCDeactivateLidCommand extends CommonCommandInfo {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCRunProfileCommand extends CommonCommandInfo {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
  result?: {}
}
export interface TCAwaitProfileCompleteCommand extends CommonCommandInfo {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
  result?: {}
}
export interface HeaterShakerSetTargetTemperatureCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
  result?: {}
}
export interface HeaterShakerAwaitTemperatureCommand extends CommonCommandInfo {
  commandType: 'heaterShaker/awaitTemperature'
  params: TemperatureParams
  result?: {}
}
export interface HeaterShakerSetTargetShakeSpeedCommand
  extends CommonCommandInfo {
  commandType: 'heaterShaker/setTargetShakeSpeed'
  params: ShakeSpeedParams
  result?: {}
}
export interface HeaterShakerAwaitShakeSpeedCommand extends CommonCommandInfo {
  commandType: 'heaterShaker/awaitShakeSpeed'
  params: ShakeSpeedParams
  result?: {}
}
export interface HeaterShakerDeactivateHeaterCommand extends CommonCommandInfo {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
  result?: {}
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
