// @flow
import magneticModuleV1 from '../module/definitions/2/magneticModuleV1.json'
import magneticModuleV2 from '../module/definitions/2/magneticModuleV2.json'
import temperatureModuleV1 from '../module/definitions/2/temperatureModuleV1.json'
import temperatureModuleV2 from '../module/definitions/2/temperatureModuleV2.json'
import thermocyclerModuleV1 from '../module/definitions/2/thermocyclerModuleV1.json'

import {
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
} from './constants'

import type { ModuleModel, ModuleRealType } from './types'

// The module objects in v2 Module Definitions representing a single module model
type Coordinates = {|
  x: number,
  y: number,
  z?: number,
|}
type AffineTransform = [number, number, number]
export type ModuleDef2 = {|
  moduleType: ModuleRealType,
  model: ModuleModel,
  labwareOffset: Coordinates,
  dimensions: {|
    bareOverallHeight: number,
    overLabwareHeight: number,
    lidHeight?: number,
  |},
  calibrationPoint: Coordinates,
  displayName: string,
  quirks: Array<string>,
  slotTransforms: {|
    [deckDef: string]: {|
      [slot: string]: {|
        [transformName: string]: AffineTransform,
      |},
    |},
  |},
  compatibleWith: Array<ModuleModel>,
|}

// TODO IMMEDIATELY: Phase out code that uses legacy models
export const getModuleDef2 = (moduleModel: ModuleModel): ModuleDef2 => {
  switch (moduleModel) {
    case MAGNETIC_MODULE_V1:
      return magneticModuleV1
    case MAGNETIC_MODULE_V2:
      return magneticModuleV2
    case TEMPERATURE_MODULE_V1:
      return temperatureModuleV1
    case TEMPERATURE_MODULE_V2:
      return temperatureModuleV2
    case THERMOCYCLER_MODULE_V1:
      return thermocyclerModuleV1
    default:
      throw new Error(`Invalid module model ${moduleModel}`)
  }
}

export const getModuleTypeFromModuleModel = (
  moduleModel: ModuleModel
): ModuleRealType => {
  return getModuleDef2(moduleModel).moduleType
}

// use a name like 'magdeck' or 'magdeckGen2' to get displayName for app
export function getModuleDisplayName(moduleModel: ModuleModel): string {
  return getModuleDef2(moduleModel).displayName
}
