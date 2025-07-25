import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Labware } from '../../../file-types'
import type { MoveLiquidPrefixType } from '../../../resources/types'

export const getMigratedPositionFromTop = (
  labwareDefsByURI: Record<string, LabwareDefinition2>,
  formLabwareId: string,
  labware: Labware,
  type: MoveLiquidPrefixType
): number => {
  const labwareDefUri = labware[formLabwareId]?.labwareDefURI

  //    early exit for dispense_labware equaling trashBin or wasteChute
  if (labwareDefsByURI[labwareDefUri] == null) {
    return 0
  }

  const matchingLabwareWellDepth = labwareDefUri
    ? labwareDefsByURI[labwareDefUri].wells.A1.depth
    : 0

  if (matchingLabwareWellDepth === 0) {
    console.error(
      `error in finding the ${type} labware well depth with labware uri ${labwareDefUri}`
    )
  }
  return matchingLabwareWellDepth
}
