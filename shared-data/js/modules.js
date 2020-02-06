// @flow
import type { ModuleModel, ModuleRealType } from './types'
import moduleSpecs from '../module/definitions/1.json'

// The module objects in v2 Module Definitions representing a single module model
type Coordinates = {|
  x: number,
  y: number,
  z?: number,
|}
type AffineTransform = [number, number, number]
export type ModuleDef2 = {|
  moduleType: ModuleRealType,
  labwareOffset: Coordinates,
  dimensions: {|
    bareOverallHeight: number,
    overLabwareHeight: number,
    lidHeight?: number,
  |},
  calibrationPoint: Coordinates,
  displayName: string,
  loadNames: Array<string>,
  quirks: Array<string>,
  slotTransforms: {|
    [deckDef: string]: {|
      [slot: string]: {|
        [transformName: string]: AffineTransform,
      |},
    |},
  |},
  compatibleWith: Array<string>,
|}

export const getModuleDef2 = (moduleModel: ModuleModel): ModuleDef2 | null => {
  return moduleSpecs[moduleModel] || null
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
