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

export interface TemperatureModule extends CommonModuleInfo {
  moduleType: typeof TEMPERATURE_MODULE_TYPE
  moduleModel: TemperatureModuleModel
  data: ApiTypes.TemperatureData
}

export interface MagneticModule extends CommonModuleInfo {
  moduleType: typeof MAGNETIC_MODULE_TYPE
  moduleModel: MagneticModuleModel
  data: ApiTypes.MagneticData
}

export interface ThermocyclerModule extends CommonModuleInfo {
  moduleType: typeof THERMOCYCLER_MODULE_TYPE
  moduleModel: ThermocyclerModuleModel
  data: ApiTypes.ThermocyclerData
}

export interface HeaterShakerModule extends CommonModuleInfo {
  moduleType: typeof HEATERSHAKER_MODULE_TYPE
  moduleModel: HeaterShakerModuleModel
  data: ApiTypes.HeaterShakerData
}

export interface AbsorbanceReaderModule extends CommonModuleInfo {
  moduleType: typeof ABSORBANCE_READER_TYPE
  moduleModel: AbsorbanceReaderModel
  data: ApiTypes.AbsorbanceReaderData
}
export interface FlexStackerModule extends CommonModuleInfo {
  moduleType: typeof FLEX_STACKER_MODULE_TYPE
  moduleModel: FlexStackerModuleModel
  data: ApiTypes.FlexStackerData
  moduleOffset?: ApiTypes.ModuleOffset
}
export interface VacuumModule extends CommonModuleInfo {
  moduleType: typeof VACUUM_MODULE_TYPE
  moduleModel: VacuumModuleModel
  data: ApiTypes.VacuumModuleData
  moduleOffset?: ApiTypes.ModuleOffset
}
export type AttachedModule =
  | TemperatureModule
  | MagneticModule
  | ThermocyclerModule
  | HeaterShakerModule
  | AbsorbanceReaderModule
  | FlexStackerModule
  | VacuumModule

export interface ModulesMeta {
  cursor: number
  totalLength: number
}

export interface Modules {
  data: AttachedModule[]
  meta: ModulesMeta
}

export interface UpdateModuleResponse {
  message: string
}
