import {
  FLEX_STACKER_MODULE_V1,
  getModuleMaxFillHeight,
} from '@opentrons/shared-data'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

export const getIsNestedDefinitionALid = (
  def?: LabwareDefinition2
): boolean => {
  return def?.allowedRoles?.includes('lid') ?? false
}

export const getHopperStackLimit = (zHeight: number): number => {
  return Math.floor(getModuleMaxFillHeight(FLEX_STACKER_MODULE_V1) / zHeight)
}
