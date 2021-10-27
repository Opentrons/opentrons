export type ModuleCommand =
  | {
      commandType: 'magneticModule/engageMagnet'
      params: EngageMagnetParams
      result?: {}
    }
  | {
      commandType: 'magneticModule/disengageMagnet'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'temperatureModule/setTargetTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'temperatureModule/deactivate'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'temperatureModule/awaitTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/setTargetBlockTemperature'
      params: ThermocyclerSetTargetBlockTemperatureParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/setTargetLidTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/awaitBlockTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/awaitLidTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/openLid'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/closeLid'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/deactivateBlock'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/deactivateLid'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/runProfile'
      params: TCProfileParams
      result?: {}
    }
  | {
      commandType: 'thermocycler/awaitProfileComplete'
      params: ModuleOnlyParams
      result?: {}
    }
  | {
      commandType: 'heaterShaker/setTargetTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'heaterShaker/awaitTemperature'
      params: TemperatureParams
      result?: {}
    }
  | {
      commandType: 'heaterShaker/setTargetShakeSpeed'
      params: ShakeSpeedParams
      result?: {}
    }
  | {
      commandType: 'heaterShaker/awaitShakeSpeed'
      params: ShakeSpeedParams
      result?: {}
    }
  | {
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
