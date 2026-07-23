import type { ModuleOffset } from '@opentrons/api-client'
import type {
  ABSORBANCE_READER_TYPE,
  AbsorbanceReaderModel,
  FLEX_STACKER_MODULE_TYPE,
  FlexStackerModuleModel,
  HEATERSHAKER_MODULE_TYPE,
  HeaterShakerModuleModel,
  MAGNETIC_MODULE_TYPE,
  MagneticModuleModel,
  TEMPERATURE_MODULE_TYPE,
  TemperatureModuleModel,
  THERMOCYCLER_MODULE_TYPE,
  ThermocyclerModuleModel,
  VACUUM_MODULE_TYPE,
  VacuumModuleModel,
} from '@opentrons/shared-data'
import type * as ApiTypes from './api-types'

export * from './api-types'

// common types

export type CommonModuleInfo = Omit<
  ApiTypes.ApiBaseModule,
  'model' | 'displayName' | 'moduleModel'
>

export type Slot =
  '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11'

export interface TemperatureModule extends CommonModuleInfo {
  moduleType: typeof TEMPERATURE_MODULE_TYPE
  moduleModel: TemperatureModuleModel
  data: ApiTypes.TemperatureData
  moduleOffset?: ModuleOffset
}

export interface MagneticModule extends CommonModuleInfo {
  moduleType: typeof MAGNETIC_MODULE_TYPE
  moduleModel: MagneticModuleModel
  data: ApiTypes.MagneticData
  moduleOffset?: ModuleOffset
}

export interface ThermocyclerModule extends CommonModuleInfo {
  moduleType: typeof THERMOCYCLER_MODULE_TYPE
  moduleModel: ThermocyclerModuleModel
  data: ApiTypes.ThermocyclerData
  moduleOffset?: ModuleOffset
}

export interface HeaterShakerModule extends CommonModuleInfo {
  moduleType: typeof HEATERSHAKER_MODULE_TYPE
  moduleModel: HeaterShakerModuleModel
  data: ApiTypes.HeaterShakerData
  moduleOffset?: ModuleOffset
}

export interface AbsorbanceReaderModule extends CommonModuleInfo {
  moduleType: typeof ABSORBANCE_READER_TYPE
  moduleModel: AbsorbanceReaderModel
  data: ApiTypes.AbsorbanceReaderData
  moduleOffset?: ModuleOffset
}

export interface FlexStackerModule extends CommonModuleInfo {
  moduleType: typeof FLEX_STACKER_MODULE_TYPE
  moduleModel: FlexStackerModuleModel
  data: ApiTypes.FlexStackerData
  moduleOffset?: ModuleOffset
}

export interface VacuumModule extends CommonModuleInfo {
  moduleType: typeof VACUUM_MODULE_TYPE
  moduleModel: VacuumModuleModel
  data: ApiTypes.VacuumModuleData
  moduleOffset?: ModuleOffset
}

export type AttachedModule =
  | TemperatureModule
  | MagneticModule
  | ThermocyclerModule
  | HeaterShakerModule
  | AbsorbanceReaderModule
  | FlexStackerModule
  | VacuumModule

export interface MatchedModule {
  slot: Slot
  module: AttachedModule
}
