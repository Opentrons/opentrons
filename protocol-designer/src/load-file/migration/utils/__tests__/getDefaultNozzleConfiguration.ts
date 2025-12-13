import { ALL, getPipetteSpecsV2, SINGLE } from '@opentrons/shared-data'

import type { NozzleConfigurationStyle } from '@opentrons/shared-data'
import type { Pipettes } from '/protocol-designer/file-types'

export const getDefaultNozzleConfiguration = (
  rawNozzles: NozzleConfigurationStyle | null,
  pipettes: Pipettes,
  pipetteId: string
): NozzleConfigurationStyle => {
  if (rawNozzles != null) {
    return rawNozzles
  }
  const pipetteName = pipettes?.[pipetteId]?.pipetteName ?? null
  const pipetteSpecs =
    pipetteName != null ? getPipetteSpecsV2(pipetteName) : null
  const pipetteChannels = pipetteSpecs?.channels

  switch (pipetteChannels) {
    case 1:
      return SINGLE
    case 8:
    case 96:
      return ALL

    // should not hit
    default:
      console.warn('Unknown pipette channels:', pipetteChannels)
      return ALL
  }
}
