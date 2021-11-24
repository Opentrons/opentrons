import isEqual from 'lodash/isEqual'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

const TRASH_LOCATION = { slotName: '12' }

export const getLatestLabwareOffsetCount = (
  labwareOffsets: LabwareOffset[]
): number => {
  const uniqueLabwareInstances = labwareOffsets.reduce<Set<string>>(
    (uniqueLabwareInstances, offset) => {
      const location = offset.location
      const definitionUri = offset.definitionUri
      const vector = offset.vector
      const locationKey =
        'slotName' in location ? location.slotName : location.moduleId
      // key by definition uri AND location, because labware offsets are tied to a combo of both of these attributes
      const id = `${definitionUri}_${locationKey}`
      if (
        !uniqueLabwareInstances.has(id) &&
        !isEqual(location, TRASH_LOCATION) &&
        !isEqual(vector, IDENTITY_VECTOR)
      ) {
        return uniqueLabwareInstances.add(id)
      }
      return uniqueLabwareInstances
    },
    new Set()
  )
  return uniqueLabwareInstances.size
}
