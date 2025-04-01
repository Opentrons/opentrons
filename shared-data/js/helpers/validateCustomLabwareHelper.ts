import flatten from 'lodash/flatten'
import type { LabwareDefinition2 } from '..'

/**
 * This function is used to help validate that the wells and ordering matches in
 * a custom labware definition in terms of the wellName and the wells length
 *
 * @param definition - a labware definition
 * @returns A boolean for if they exist
 */
export const validateCustomLabwareHelper = (
  definition: LabwareDefinition2 | null
): boolean => {
  return (
    definition != null &&
    Object.keys(definition.wells).length ===
      flatten(definition.ordering).length &&
    Object.keys(definition.wells).every(well =>
      flatten(definition.ordering).includes(well)
    )
  )
}
