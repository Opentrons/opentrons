import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'

export function getSelectedWellCount(
  pipette: PipetteV2Specs,
  labware: LabwareDefinition2,
  wells: string[]
): number {
  if (pipette.channels === 1) {
    return wells.length
  } else if (
    labware.metadata.displayCategory === 'reservoir' &&
    labware.groups[0].wells.length === 1
  ) {
    return 1
  } else if (
    labware.metadata.displayCategory === 'reservoir' &&
    labware.groups[0].wells.length === 12
  ) {
    if (pipette.channels === 8) {
      return wells.length
    } else if (pipette.channels === 96) {
      return 12
    }
  }
  return pipette.channels * wells.length
}
