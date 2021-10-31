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

export interface MagneticModuleEngageMagnetCommand {
  commandType: 'magneticModule/engageMagnet'
  params: EngageMagnetParams
  result?: {}
}
export interface MagneticModuleDisengageMagnetCommand {
  commandType: 'magneticModule/disengageMagnet'
  params: ModuleOnlyParams
  result?: {}
}
export interface TemperatureModuleSetTargetTemperatureCommand {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TemperatureModuleDeactivateCommand {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
  result?: {}
}
export interface TemperatureModuleAwaitTemperatureCommand {
  commandType: 'temperatureModule/awaitTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCSetTargetBlockTemperatureCommand {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
  result?: {}
}
export interface TCSetTargetLidTemperatureCommand {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCAwaitBlockTemperatureCommand {
  commandType: 'thermocycler/awaitBlockTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCAwaitLidTemperatureCommand {
  commandType: 'thermocycler/awaitLidTemperature'
  params: TemperatureParams
  result?: {}
}
export interface TCOpenLidCommand {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCCloseLidCommand {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCDeactivateBlockCommand {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCDeactivateLidCommand {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
  result?: {}
}
export interface TCRunProfileCommand {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
  result?: {}
}
export interface TCAwaitProfileCompleteCommand {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
  result?: {}
}
export interface HeaterShakerSetTargetTemperatureCommand {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
  result?: {}
}
export interface HeaterShakerAwaitTemperatureCommand {
  commandType: 'heaterShaker/awaitTemperature'
  params: TemperatureParams
  result?: {}
}
export interface HeaterShakerSetTargetShakeSpeedCommand {
  commandType: 'heaterShaker/setTargetShakeSpeed'
  params: ShakeSpeedParams
  result?: {}
}
export interface HeaterShakerAwaitShakeSpeedCommand {
  commandType: 'heaterShaker/awaitShakeSpeed'
  params: ShakeSpeedParams
  result?: {}
}
export interface HeaterShakerDeactivateHeaterCommand {
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
