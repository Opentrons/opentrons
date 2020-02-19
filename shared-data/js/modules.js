// @flow
import magneticModuleV1 from '../module/definitions/2/magneticModuleV1.json'
import magneticModuleV2 from '../module/definitions/2/magneticModuleV2.json'
import temperatureModuleV1 from '../module/definitions/2/temperatureModuleV1.json'
import temperatureModuleV2 from '../module/definitions/2/temperatureModuleV2.json'
import thermocyclerModuleV1 from '../module/definitions/2/thermocyclerModuleV1.json'

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
    case MAGDECK: // TODO IMMEDIATE: Remove when callsites use only new models
    case MAGNETIC_MODULE_V1: // fallthrough: legacy model
      return magneticModuleV1
    case MAGNETIC_MODULE_V2:
      return magneticModuleV2
    case TEMPDECK: // TODO IMMEDIATE: Remove when callsites use only new models
    case TEMPERATURE_MODULE_V1: // fallthrough: legacy model
      return temperatureModuleV1
    case TEMPERATURE_MODULE_V2:
      return temperatureModuleV2
    case THERMOCYCLER: // TODO IMMEDIATE: Remove when callsites use only new models
    case THERMOCYCLER_MODULE_V1: // fallthrough: legacy model
      return thermocyclerModuleV1
    default:
      throw new Error(`Invalid module model ${moduleModel}`)
  }
}

// DO NOT MERGE! these should immediately be replaced with Seth's constants imported above. These
// below are redundant.

// NOTE: these MODEL values should match definition names in shared-data/module/definitions/2/
// (not to be confused with MODULE TYPE)
// !!! TODO IMMEDIATELY double-check there match Seth's PR. DO NOT MERGE until 4936 is merged.
export const MAGDECK_MODEL_GEN1: 'magneticModuleV1' = 'magneticModuleV1'
export const MAGDECK_MODEL_GEN2: 'magneticModuleV2' = 'magneticModuleV2'
export const TEMPDECK_MODEL_GEN1: 'temperatureModuleV1' = 'temperatureModuleV1'
export const TEMPDECK_MODEL_GEN2: 'temperatureModuleV2' = 'temperatureModuleV2'
export const THERMOCYCLER_MODEL_GEN1: 'thermocyclerModuleV1' =
  'thermocyclerModuleV1'

export const getModuleTypeFromModuleModel = (
  moduleModel: ModuleModel
): ModuleRealType => {
  return getModuleDef2(moduleModel).moduleType
}

// use module model (not type!) to get displayName for app
// !!! TODO IMMEDIATELY: blocked by Seth's PR
export function getModuleDisplayName(moduleModel: ModuleModel): string {
  return getModuleDef2(moduleModel).displayName
}
