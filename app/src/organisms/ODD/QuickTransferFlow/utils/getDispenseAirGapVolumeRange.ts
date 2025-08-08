import { getTiprackVolume } from '@opentrons/shared-data'

import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'
import type { PathOption } from '../types'

interface VolumeRange {
  min: number
  max: number
}

export const getDispenseAirGapVolumeRange = (
  volume: number,
  disposalVolume: number,
  path: PathOption,
  pipette: PipetteV2Specs,
  tipRack: LabwareDefinition2
): VolumeRange => {
  const maxPipetteVolume = Object.values(pipette.liquids)[0].maxVolume
  const minAirGapVolume = 0
  const tipRackTipVol = getTiprackVolume(tipRack)
  const capacity = Math.min(maxPipetteVolume, tipRackTipVol)
  const maxAirGapVolume =
    path === 'multiDispense' ? capacity - disposalVolume - volume : capacity
  return {
    min: minAirGapVolume,
    max: maxAirGapVolume,
  }
}
