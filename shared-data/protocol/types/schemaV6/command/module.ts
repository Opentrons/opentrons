import { CommonCommandRunTimeInfo } from '.'

export type ModuleRunTimeCommand =
  | MagneticModuleEngageMagnetRunTimeCommand
  | MagneticModuleDisengageMagnetRunTimeCommand
  | TemperatureModuleSetTargetTemperatureRunTimeCommand
  | TemperatureModuleDeactivateRunTimeCommand
  | TemperatureModuleAwaitTemperatureRunTimeCommand
  | TCSetTargetBlockTemperatureRunTimeCommand
  | TCSetTargetLidTemperatureRunTimeCommand
  | TCAwaitBlockTemperatureRunTimeCommand
  | TCAwaitLidTemperatureRunTimeCommand
  | TCOpenLidRunTimeCommand
  | TCCloseLidRunTimeCommand
  | TCDeactivateBlockRunTimeCommand
  | TCDeactivateLidRunTimeCommand
  | TCRunProfileRunTimeCommand
  | TCAwaitProfileCompleteRunTimeCommand
  | HeaterShakerSetTargetTemperatureRunTimeCommand
  | HeaterShakerAwaitTemperatureRunTimeCommand
  | HeaterShakerSetTargetShakeSpeedRunTimeCommand
  | HeaterShakerAwaitShakeSpeedRunTimeCommand
  | HeaterShakerDeactivateHeaterRunTimeCommand

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

export interface MagneticModuleEngageMagnetCreateCommand {
  commandType: 'magneticModule/engageMagnet'
  params: EngageMagnetParams
}
export interface MagneticModuleEngageMagnetRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MagneticModuleEngageMagnetCreateCommand {
  result: any
}
export interface MagneticModuleDisengageMagnetCreateCommand {
  commandType: 'magneticModule/disengageMagnet'
  params: ModuleOnlyParams
}
export interface MagneticModuleDisengageMagnetRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MagneticModuleDisengageMagnetCreateCommand {
  result: any
}
export interface TemperatureModuleSetTargetTemperatureCreateCommand {
  commandType: 'temperatureModule/setTargetTemperature'
  params: TemperatureParams
}
export interface TemperatureModuleSetTargetTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TemperatureModuleSetTargetTemperatureCreateCommand {
  result: any
}
export interface TemperatureModuleDeactivateCreateCommand {
  commandType: 'temperatureModule/deactivate'
  params: ModuleOnlyParams
}
export interface TemperatureModuleDeactivateRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TemperatureModuleDeactivateCreateCommand {
  result: any
}
export interface TemperatureModuleAwaitTemperatureCreateCommand {
  commandType: 'temperatureModule/awaitTemperature'
  params: TemperatureParams
}
export interface TemperatureModuleAwaitTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TemperatureModuleAwaitTemperatureCreateCommand {
  result: any
}
export interface TCSetTargetBlockTemperatureCreateCommand {
  commandType: 'thermocycler/setTargetBlockTemperature'
  params: ThermocyclerSetTargetBlockTemperatureParams
}
export interface TCSetTargetBlockTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCSetTargetBlockTemperatureCreateCommand {
  result: any
}
export interface TCSetTargetLidTemperatureCreateCommand {
  commandType: 'thermocycler/setTargetLidTemperature'
  params: TemperatureParams
}
export interface TCSetTargetLidTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCSetTargetLidTemperatureCreateCommand {
  result: any
}
export interface TCAwaitBlockTemperatureCreateCommand {
  commandType: 'thermocycler/awaitBlockTemperature'
  params: TemperatureParams
}
export interface TCAwaitBlockTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCAwaitBlockTemperatureCreateCommand {
  result: any
}
export interface TCAwaitLidTemperatureCreateCommand {
  commandType: 'thermocycler/awaitLidTemperature'
  params: TemperatureParams
}
export interface TCAwaitLidTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCAwaitLidTemperatureCreateCommand {
  result: any
}
export interface TCOpenLidCreateCommand {
  commandType: 'thermocycler/openLid'
  params: ModuleOnlyParams
}
export interface TCOpenLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCOpenLidCreateCommand {
  result: any
}
export interface TCCloseLidCreateCommand {
  commandType: 'thermocycler/closeLid'
  params: ModuleOnlyParams
}
export interface TCCloseLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCCloseLidCreateCommand {
  result: any
}
export interface TCDeactivateBlockCreateCommand {
  commandType: 'thermocycler/deactivateBlock'
  params: ModuleOnlyParams
}
export interface TCDeactivateBlockRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCDeactivateBlockCreateCommand {
  result: any
}
export interface TCDeactivateLidCreateCommand {
  commandType: 'thermocycler/deactivateLid'
  params: ModuleOnlyParams
}
export interface TCDeactivateLidRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCDeactivateLidCreateCommand {
  result: any
}
export interface TCRunProfileCreateCommand {
  commandType: 'thermocycler/runProfile'
  params: TCProfileParams
}
export interface TCRunProfileRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCRunProfileCreateCommand {
  result: any
}
export interface TCAwaitProfileCompleteCreateCommand {
  commandType: 'thermocycler/awaitProfileComplete'
  params: ModuleOnlyParams
}
export interface TCAwaitProfileCompleteRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TCAwaitProfileCompleteCreateCommand {
  result: any
}
export interface HeaterShakerSetTargetTemperatureCreateCommand {
  commandType: 'heaterShaker/setTargetTemperature'
  params: TemperatureParams
}
export interface HeaterShakerSetTargetTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerSetTargetTemperatureCreateCommand {
  result: any
}
export interface HeaterShakerAwaitTemperatureCreateCommand {
  commandType: 'heaterShaker/awaitTemperature'
  params: TemperatureParams
}
export interface HeaterShakerAwaitTemperatureRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerAwaitTemperatureCreateCommand {
  result: any
}
export interface HeaterShakerSetTargetShakeSpeedCreateCommand {
  commandType: 'heaterShaker/setTargetShakeSpeed'
  params: ShakeSpeedParams
}
export interface HeaterShakerSetTargetShakeSpeedRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerSetTargetShakeSpeedCreateCommand {
  result: any
}
export interface HeaterShakerAwaitShakeSpeedCreateCommand {
  commandType: 'heaterShaker/awaitShakeSpeed'
  params: ShakeSpeedParams
}
export interface HeaterShakerAwaitShakeSpeedRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerAwaitShakeSpeedCreateCommand {
  result: any
}
export interface HeaterShakerDeactivateHeaterCreateCommand {
  commandType: 'heaterShaker/deactivateHeater'
  params: ModuleOnlyParams
}
export interface HeaterShakerDeactivateHeaterRunTimeCommand
  extends CommonCommandRunTimeInfo,
    HeaterShakerDeactivateHeaterCreateCommand {
  result: any
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
