export type ModuleCommand =
  | { commandType: 'magneticModule/engageMagnet'; params: EngageMagnetParams }
  | { commandType: 'magneticModule/disengageMagnet'; params: ModuleOnlyParams }
  | {
      commandType: 'temperatureModule/setTargetTemperature'
      params: TemperatureParams
    }
  | { commandType: 'temperatureModule/deactivate'; params: ModuleOnlyParams }
  | {
      commandType: 'temperatureModule/awaitTemperature'
      params: TemperatureParams
    }
  | {
      commandType: 'thermocycler/setTargetBlockTemperature'
      params: ThermocyclerSetTargetBlockTemperatureParams
    }
  | {
      commandType: 'thermocycler/setTargetLidTemperature'
      params: TemperatureParams
    }
  | {
      commandType: 'thermocycler/awaitBlockTemperature'
      params: TemperatureParams
    }
  | {
      commandType: 'thermocycler/awaitLidTemperature'
      params: TemperatureParams
    }
  | { commandType: 'thermocycler/openLid'; params: ModuleOnlyParams }
  | { commandType: 'thermocycler/closeLid'; params: ModuleOnlyParams }
  | { commandType: 'thermocycler/deactivateBlock'; params: ModuleOnlyParams }
  | { commandType: 'thermocycler/deactivateLid'; params: ModuleOnlyParams }
  | { commandType: 'thermocycler/runProfile'; params: TCProfileParams }
  | {
      commandType: 'thermocycler/awaitProfileComplete'
      params: ModuleOnlyParams
    }
  | {
      commandType: 'heaterShaker/setTargetTemperature'
      params: TemperatureParams
    }
  | {
      commandType: 'heaterShaker/awaitTemperature'
      params: TemperatureParams
    }
  | {
      commandType: 'heaterShaker/setTargetShakeSpeed'
      params: ShakeSpeedParams
    }
  | {
      commandType: 'heaterShaker/awaitShakeSpeed'
      params: ShakeSpeedParams
    }
  | {
      commandType: 'heaterShaker/deactivateHeater'
      params: ModuleOnlyParams
    }
  | {
      commandType: 'heaterShaker/deactivateShaker'
      params: ModuleOnlyParams
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
