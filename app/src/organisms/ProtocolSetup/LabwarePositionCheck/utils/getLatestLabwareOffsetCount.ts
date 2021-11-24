import type { LabwareOffset } from '@opentrons/api-client'

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
    const locationKey =
      'slotName' in location ? location.slotName : location.moduleId
    const id = `${definitionUri}_${locationKey}`
    if (!uniqueLabwareInstances.has(id)) {
      count = count + 1
    }
    uniqueLabwareInstances.add(id)
  })

  return count
}
