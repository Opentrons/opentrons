import type { LabwareDefinition } from '../types'

/**
 * This function is used to help validate that the wells and ordering matches in
 * a custom labware definition in terms of the wellName and the wells length
 *
 * @param definition - a labware definition
 * @returns A boolean for if they exist
 */
export const validateCustomLabwareHelper = (
  definition?: LabwareDefinition | null
): boolean => {
  if (definition == null) {
    return false
  }
  const wellSet = new Set(definition.ordering.flat())
  const wellKeys = Object.keys(definition.wells)

  return (
    wellKeys.length === wellSet.size &&
    wellKeys.every(well => wellSet.has(well))
  )
}
