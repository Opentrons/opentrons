// @flow
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

export const getModuleDef2 = (moduleModel: ModuleModel): ModuleDef2 | null => {
  try {
    return require(`../module/definitions/2/${moduleModel}.json`)
  } catch (ex) {
    return null
  }
}

export const getModuleTypeFromModuleModel = (
  moduleModel: string
): ModuleRealType | null => {
  const moduleDef = getModuleDef2(moduleModel)
  if (!moduleDef) {
    return null
  }
  return moduleDef.moduleType
}

// use a name like 'magdeck' or 'magdeckGen2' to get displayName for app
export function getModuleDisplayName(moduleModel: ModuleModel): string {
  const moduleDef = getModuleDef2(moduleModel)
  if (!moduleDef) {
    console.error(`unsupported moduleModel: '${moduleModel}'`)
    return 'ERROR'
  }
  return moduleDef.displayName
}
