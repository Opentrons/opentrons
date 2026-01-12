import { FLEX_STACKER_MODULE_V1 } from '../constants'
import { getModuleDef } from '../modules'
import { getSchema2Dimensions } from './positionMath'

import type { LabwareDefinition, ModuleModel, Vector3D } from '../types'

export const getModuleMaxFillHeight = (model: ModuleModel): number => {
  if (model === FLEX_STACKER_MODULE_V1) {
    return (
      getModuleDef(FLEX_STACKER_MODULE_V1).dimensions.maxStackerFillHeight ?? 0
    )
  }
  console.error(`Invalid module model for max fill height: ${model}`)
  return 0
}

export const getStackerMaxPoolCountByHeight = (
  model: ModuleModel,
  poolHeight: number,
  poolOverlap: number
): number => {
  if (model === FLEX_STACKER_MODULE_V1) {
    const maxFillHeight = getModuleMaxFillHeight(model)
    if (maxFillHeight <= 0) {
      console.error(
        `Invalid max fill height for ${model}: ${maxFillHeight} must be greater than 0`
      )
    }
    return Math.floor(
      (maxFillHeight - poolOverlap) / (poolHeight - poolOverlap)
    )
  }
  console.error(`Invalid module model for max pool count by height: ${model}`)
  return 0
}

export const getLabwareOverlapOffset = (
  definition: LabwareDefinition,
  belowLabwareLoadName: string
): Vector3D => {
  return (
    definition.stackingOffsetWithLabware?.[belowLabwareLoadName] ??
    definition.stackingOffsetWithLabware?.default ?? { x: 0, y: 0, z: 0 }
  )
}

export const getHeightOfLabwareStackFromDefinitions = (
  bottomUpDefinitions: LabwareDefinition[]
): number => {
  if (bottomUpDefinitions.length === 0) {
    return 0
  }
  let lowerDef: LabwareDefinition = bottomUpDefinitions[0]
  let total_height = getSchema2Dimensions(lowerDef).zDimension
  for (const upperDef of bottomUpDefinitions.slice(1)) {
    const overlap = getLabwareOverlapOffset(
      upperDef,
      lowerDef.parameters.loadName
    ).z
    total_height += getSchema2Dimensions(upperDef).zDimension - overlap
    lowerDef = upperDef
  }
  return total_height
}

export const getMaxPoolCount = (args: {
  labwareDefinitions: {
    primary: LabwareDefinition
    adapter: LabwareDefinition | null
    lid: LabwareDefinition | null
  }
  model: ModuleModel
}): number => {
  const { labwareDefinitions, model } = args
  const { primary, adapter, lid } = labwareDefinitions
  const topDefinition = lid ?? adapter ?? primary
  // bottom-up
  const poolHeight = getHeightOfLabwareStackFromDefinitions([
    ...(adapter != null ? [adapter] : []),
    primary,
    ...(lid != null ? [lid] : []),
  ])
  const bottomLabwareDefinition = adapter != null ? adapter : primary

  const poolOverlap = getLabwareOverlapOffset(
    topDefinition,
    bottomLabwareDefinition.parameters.loadName
  )
  return getStackerMaxPoolCountByHeight(model, poolHeight, poolOverlap.z)
}
