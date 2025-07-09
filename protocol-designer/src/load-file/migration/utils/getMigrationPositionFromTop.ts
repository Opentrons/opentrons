import { Labware } from '../../../file-types'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { MoveLiquidPrefixType } from '../../../resources/types'

export const getMigratedPositionFromTop = (
  labwareDefinitions: {
    [definitionId: string]: LabwareDefinition2
  },
  formLabwareId: string,
  labware: Labware,
  type: MoveLiquidPrefixType
): number => {
  const labwareDefUri = labware[formLabwareId].labwareDefURI

  if (labwareDefUri == null) {
    console.error(
      `unable to find matching labware def uri from form labware id ${formLabwareId}`
    )
  }

  //    early exit for dispense_labware equaling trashBin or wasteChute
  if (labwareDefinitions[labwareDefUri] == null) {
    return 0
  }

  const matchingLabwareWellDepth = labwareDefUri
    ? labwareDefinitions[labwareDefUri].wells.A1.depth
    : 0

  if (matchingLabwareWellDepth === 0) {
    console.error(
      `error in finding the ${type} labware well depth with labware uri ${labwareDefUri}`
    )
  }
  return matchingLabwareWellDepth
}
