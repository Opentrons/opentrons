import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

export function getCurrentOffsetForLabwareInLocation(
  allLabwareOffsets: LabwareOffset[],
  definitionUri: string,
  location: LabwareOffset['location']
): LabwareOffset | null {
  const mostRecentLabwareOffsets = uniqBy<LabwareOffset>(
    allLabwareOffsets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    offset => {
      const locationKey =
        offset.location.moduleModel != null
          ? `${String(offset.location.moduleModel)}_${String(
              offset.location.slotName
            )}`
          : offset.location.slotName
      return `${String(offset.definitionUri)}_${String(locationKey)}`
    }
  )
  return (
    mostRecentLabwareOffsets?.find(
      offsetRecord =>
        offsetRecord.definitionUri === definitionUri &&
        'slotName' in offsetRecord.location &&
        'slotName' in location &&
        offsetRecord.location?.slotName === location?.slotName &&
        isEqual(offsetRecord.location, location) &&
        !isEqual(offsetRecord.vector, IDENTITY_VECTOR)
    ) ?? null
  )
}
