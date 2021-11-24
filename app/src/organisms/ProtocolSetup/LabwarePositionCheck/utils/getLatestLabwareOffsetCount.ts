import isEqual from 'lodash/isEqual'
import type { LabwareOffset } from '@opentrons/api-client'

const IDENTITY_OFFSET = { x: 0, y: 0, z: 0 }
const TRASH_LOCATION = { slotName: '12' }

export const getLatestLabwareOffsetCount = (
  labwareOffsets: LabwareOffset[]
): number => {
  if (labwareOffsets.length === 0) {
    return 0
  }
  if (labwareOffsets.length === 1) {
    return 1
  }

  let count = 0
  const uniqueLabwareInstances = new Set()
  labwareOffsets.forEach(offset => {
    const location = offset.location
    const definitionUri = offset.definitionUri
    const vector = offset.vector
    const locationKey =
      'slotName' in location ? location.slotName : location.moduleId
    const id = `${definitionUri}_${locationKey}`
    if (
      !uniqueLabwareInstances.has(id) &&
      !isEqual(vector, IDENTITY_OFFSET) &&
      !isEqual(location, TRASH_LOCATION)
    ) {
      count = count + 1
    }
    uniqueLabwareInstances.add(id)
  })

  return count
}
