import type { LabwareDefinition2 } from '@opentrons/shared-data'

export const getIsNestedDefinitionALid = (
  def?: LabwareDefinition2
): boolean => {
  return def?.allowedRoles?.includes('lid') ?? false
}
