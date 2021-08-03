import magneticModuleV1 from '../module/definitions/3/magneticModuleV1.json'
import magneticModuleV2 from '../module/definitions/3/magneticModuleV2.json'
import temperatureModuleV1 from '../module/definitions/3/temperatureModuleV1.json'
import temperatureModuleV2 from '../module/definitions/3/temperatureModuleV2.json'
import thermocyclerModuleV1 from '../module/definitions/3/thermocyclerModuleV1.json'

import {
  MAGDECK,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPDECK,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER,
  THERMOCYCLER_MODULE_V1,
} from './constants'

import type { ModuleModel, ModuleRealType, ModuleType } from './types'

// The module objects in v2 Module Definitions representing a single module model
interface Coordinates {
  x: number
  y: number
  z?: number
}

type AffineTransform = [number, number, number]

export interface ModuleDef2 {
  moduleType: ModuleRealType
  model: ModuleModel
  labwareOffset: Coordinates
  dimensions: {
    bareOverallHeight: number
    overLabwareHeight: number
    lidHeight?: number
  }
  calibrationPoint: Coordinates
  displayName: string
  quirks: string[]
  slotTransforms: {
    [deckDef: string]: {
      [slot: string]: {
        [transformName: string]: AffineTransform
      }
    }
  }
  compatibleWith: ModuleModel[]
}

// TODO IMMEDIATELY: Phase out code that uses legacy models
export const getModuleDef2 = (moduleModel: ModuleModel): ModuleDef2 => {
  switch (moduleModel) {
    case MAGNETIC_MODULE_V1:
      return magneticModuleV1 as ModuleDef2

    case MAGNETIC_MODULE_V2:
      return (magneticModuleV2 as unknown) as ModuleDef2

    case TEMPERATURE_MODULE_V1:
      return temperatureModuleV1 as ModuleDef2

    case TEMPERATURE_MODULE_V2:
      return (temperatureModuleV2 as unknown) as ModuleDef2

    case THERMOCYCLER_MODULE_V1:
      return thermocyclerModuleV1 as ModuleDef2

    default:
      throw new Error(`Invalid module model ${moduleModel as string}`)
  }
}

export function normalizeModuleModel(legacyModule: ModuleType): ModuleModel {
  switch (legacyModule) {
    case TEMPDECK:
      return TEMPERATURE_MODULE_V1

    case MAGDECK:
      return MAGNETIC_MODULE_V1

    case THERMOCYCLER:
      return THERMOCYCLER_MODULE_V1

    default:
      throw new Error(`Invalid legacy module model ${legacyModule as string}`)
  }
}

export function getModuleType(moduleModel: ModuleModel): ModuleRealType {
  return getModuleDef2(moduleModel).moduleType
}

// use module model (not type!) to get model-specific displayName for UI
export function getModuleDisplayName(moduleModel: ModuleModel): string {
  return getModuleDef2(moduleModel).displayName
}

export function checkModuleCompatibility(
  modelA: ModuleModel,
  modelB: ModuleModel
): boolean {
  const bDef = getModuleDef2(modelB)
  return modelA === modelB || bDef.compatibleWith.includes(modelA)
}
