import { FLEX_STACKER_MODULE_V1 } from '../constants'
import { getModuleDef } from '../modules'

import type { LabwareDefinition, ModuleModel, Vector3D } from '../types'

export const getModuleMaxFillHeight = (model: ModuleModel): number => {
  if (model === FLEX_STACKER_MODULE_V1) {
    return (
      getModuleDef(FLEX_STACKER_MODULE_V1).dimensions.maxStackerFillHeight ?? 0
    )
  }
  throw new Error(`Invalid module model for max fill height: ${model}`)
}

export const getStackerMaxPoolCountByHeight = (
  model: ModuleModel,
  poolHeight: number,
  poolOverlap: number
): number => {
  if (model === FLEX_STACKER_MODULE_V1) {
    const maxFillHeight = getModuleMaxFillHeight(model)
    console.log('maxFillHeight:', maxFillHeight)
    if (maxFillHeight <= 0) {
      throw new Error(
        `Invalid max fill height for ${model}: ${maxFillHeight} must be greater than 0`
      )
    }
    return Math.floor(
      (maxFillHeight - poolOverlap) / (poolHeight - poolOverlap)
    )
  }
  throw new Error(`Invalid module model for max pool count by height: ${model}`)
}

export const getLabwareOverlapOffset = (
  model: ModuleModel,
  definition: LabwareDefinition,
  belowLabwareName: string
): Vector3D => {
  if (model !== FLEX_STACKER_MODULE_V1) {
    throw new Error(`Invalid module model for labware overlap offset: ${model}`)
  }
  if (
    belowLabwareName in Object.keys(definition.stackingOffsetWithLabware ?? {})
  ) {
    return (
      definition.stackingOffsetWithLabware?.[belowLabwareName] ?? {
        x: 0,
        y: 0,
        z: 0,
      }
    )
  }
  return (
    definition.stackingOffsetWithLabware?.['default'] ?? { x: 0, y: 0, z: 0 }
  )
}
// export const getModuleMaxRetrievableHeight = (model: ModuleModel): number =>
//   getModuleDef(model).dimensions.maxStackerRetrievableHeight ?? 0
