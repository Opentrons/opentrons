import { AIR } from '@opentrons/step-generation'

import type { LocationLiquidState } from '@opentrons/step-generation'

export const getWellVolume = (
  labwareLocationLiquidState: LocationLiquidState
): number =>
  Object.entries(labwareLocationLiquidState).reduce(
    (sum, [id, volume]) => (id !== AIR ? sum + volume.volume : sum),
    0
  )
