import { TEMPDECK, MAGDECK, THERMOCYCLER } from '@opentrons/shared-data'

import type {
  MagneticModuleModel,
  TemperatureModuleModel,
  ThermocyclerModuleModel,
  HeaterShakerModuleModel,
  ModuleModel,
} from '@opentrons/shared-data'

interface PhysicalPort {
  hub: number | null
  port: number | null
}

export interface ApiBaseModule {
  id: string
  displayName: string
  serial: string
  revision: string
  model: string
  moduleModel: ModuleModel
  fwVersion: string
  port: string
  hasAvailableUpdate: boolean
  usbPort: PhysicalPort
}

interface ApiBaseModuleLegacy {
  displayName: string
  serial: string
  model: string
  fwVersion: string
  port: string
  hasAvailableUpdate: boolean
}

export interface TemperatureData {
  currentTemp: number
  targetTemp: number | null
}

export interface MagneticData {
  engaged: boolean
  height: number
}

export interface ThermocyclerData {
  // TODO(mc, 2019-12-12): in_between comes from the thermocycler firmware and
  // will be rare in normal operation due to limitations in current revision
  lid: 'open' | 'closed' | 'in_between'
  lidTarget: number | null
  lidTemp: number | null
  currentTemp: number | null
  targetTemp: number | null
  holdTime: number | null
  rampRate: number | null
  totalStepCount: number | null
  currentStepIndex: number | null
  totalCycleCount: number | null
  currentCycleIndex: number | null
}
export interface HeaterShakerData {
  labwareLatchStatus: LatchStatus
  speedStatus: SpeedStatus
  temperatureStatus: TemperatureStatus
  currentSpeed: number | null
  currentTemp: number | null
  targetSpeed: number | null
  targetTemp: number | null
  errorDetails: string | null
}

export type TemperatureStatus =
  | 'idle'
  | 'holding at target'
  | 'cooling'
  | 'heating'

export type ThermocyclerStatus =
  | 'idle'
  | 'holding at target'
  | 'cooling'
  | 'heating'
  | 'error'

export type MagneticStatus = 'engaged' | 'disengaged'

export type HeaterShakerStatus = 'idle' | 'running' | 'error'

export type SpeedStatus =
  | 'holding at target'
  | 'speeding up'
  | 'slowing down'
  | 'idle'
  | 'error'

export type LatchStatus =
  | 'opening'
  | 'idle_open'
  | 'closing'
  | 'idle_closed'
  | 'idle_unknown'
  | 'unknown'

export interface ApiTemperatureModule extends ApiBaseModule {
  moduleModel: TemperatureModuleModel
  name: typeof TEMPDECK
  data: TemperatureData
  status: TemperatureStatus
}

export interface ApiTemperatureModuleLegacy extends ApiBaseModuleLegacy {
  name: typeof TEMPDECK
  data: TemperatureData
  status: TemperatureStatus
}

export interface ApiMagneticModule extends ApiBaseModule {
  moduleModel: MagneticModuleModel
  name: typeof MAGDECK
  data: MagneticData
  status: MagneticStatus
}

export interface ApiMagneticModuleLegacy extends ApiBaseModuleLegacy {
  name: typeof MAGDECK
  data: MagneticData
  status: MagneticStatus
}

export interface ApiThermocyclerModule extends ApiBaseModule {
  moduleModel: ThermocyclerModuleModel
  name: typeof THERMOCYCLER
  data: ThermocyclerData
  status: ThermocyclerStatus
}

export interface ApiThermocyclerModuleLegacy extends ApiBaseModuleLegacy {
  name: typeof THERMOCYCLER
  data: ThermocyclerData
  status: ThermocyclerStatus
}

export interface ApiHeaterShakerModule extends ApiBaseModule {
  moduleModel: HeaterShakerModuleModel
  data: HeaterShakerData
  status: HeaterShakerStatus
}

export type ApiAttachedModule =
  | ApiThermocyclerModule
  | ApiMagneticModule
  | ApiTemperatureModule
  | ApiHeaterShakerModule

export type ApiAttachedModuleLegacy =
  | ApiThermocyclerModuleLegacy
  | ApiTemperatureModuleLegacy
  | ApiMagneticModuleLegacy

export type ModuleCommand =
  | 'set_temperature'
  | 'set_block_temperature'
  | 'set_lid_temperature'
  | 'deactivate'
  | 'deactivate_lid'
  | 'deactivate_block'
  | 'open'
  | 'engage'
