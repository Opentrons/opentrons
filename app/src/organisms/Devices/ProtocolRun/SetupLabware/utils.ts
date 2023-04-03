import isEqual from 'lodash/isEqual'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'

import type { LabwareOffset } from '@opentrons/api-client'

export function getLatestCurrentOffsets(
  currentOffsets: LabwareOffset[]
): LabwareOffset[] {
  const latestCurrentOffsets = currentOffsets.reduce<LabwareOffset[]>(
    (acc, offset) => {
      const previousMatchIndex = acc.findIndex(
        currentLabwareOffsets =>
          isEqual(offset.location, currentLabwareOffsets.location) &&
          isEqual(offset.definitionUri, currentLabwareOffsets.definitionUri)
      )
      if (
        previousMatchIndex >= 0 &&
        new Date(acc[previousMatchIndex].createdAt) < new Date(offset.createdAt)
      ) {
        return [
          ...acc.slice(0, previousMatchIndex),
          ...acc.slice(previousMatchIndex + 1),
          offset,
        ]
      } else {
        return [...acc, offset]
      }
    },
    []
  )

  const nonIdentityOffsets = latestCurrentOffsets.filter(
    currentOffset => !isEqual(currentOffset.vector, IDENTITY_VECTOR)
  )

  return nonIdentityOffsets
}
