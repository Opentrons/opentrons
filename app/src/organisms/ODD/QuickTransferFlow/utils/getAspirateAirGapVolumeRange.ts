import { getTiprackVolume } from '@opentrons/shared-data'

import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'

interface VolumeRange {
  min: number
  max: number
}

export const getAspirateAirGapVolumeRange = (
  pipette: PipetteV2Specs,
  tipRack: LabwareDefinition2
): VolumeRange => {
  const minPipetteVolume = Object.values(pipette.liquids)[0].minVolume
  const maxPipetteVolume = Object.values(pipette.liquids)[0].maxVolume
  const minAirGapVolume = 0
  const tipRackTipVol = getTiprackVolume(tipRack)

  const maxAirGapVolume =
    Math.min(maxPipetteVolume, tipRackTipVol) - minPipetteVolume

  return {
    min: minAirGapVolume,
    max: maxAirGapVolume,
  }
}
