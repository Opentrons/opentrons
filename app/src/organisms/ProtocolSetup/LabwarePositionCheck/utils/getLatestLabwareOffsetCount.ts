import isEqual from 'lodash/isEqual'
import uniqBy from 'lodash/uniqBy'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'
const TRASH_LOCATION = { slotName: '12' }

// this util counts all "relevant" labware offsets that a user would care about
// i.e. filters out all identity offsets that are applied at the beginning of
// LPC, previous labware offsets that are no longer relevant, and offsets that
// were applied to the trash
export const getLatestLabwareOffsetCount = (
  labwareOffsets: LabwareOffset[]
): number => {
  // labware offsets are in order of creation, we want to use the most recent ones
  const orderedLabwareOffsets = labwareOffsets
    .slice()
    .sort((a, b) => a.date - b.date)

  const filteredLabwareOffsets = uniqBy(
    orderedLabwareOffsets,
    (offset: LabwareOffset) => {
      const location = offset.location
      const definitionUri = offset.definitionUri
      const locationKey =
        'slotName' in location ? location.slotName : location.moduleId
      // key by definition uri AND location, because labware offsets are tied to a combo of both of these attributes
      return `${definitionUri}_${locationKey}`
    }
  )

  const uniqueOffsetCount = filteredLabwareOffsets.reduce<
    LabwareOffset[],
    number
  >((acc: number, offset: LabwareOffset) => {
    const vector = offset.vector
    if (
      !isEqual(location, TRASH_LOCATION) &&
      !isEqual(vector, IDENTITY_VECTOR)
    ) {
      return acc + 1
    }
    return acc
  }, 0)
  return uniqueOffsetCount
}
