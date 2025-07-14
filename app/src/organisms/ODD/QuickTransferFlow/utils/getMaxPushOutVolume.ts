import { round } from 'lodash'

import type { PipetteV2Specs } from '@opentrons/shared-data'

export const getMaxPushOutVolume = (
  transferVolume: number,
  pipetteSpecs: PipetteV2Specs
): number => {
  const { liquids, plungerPositionsConfigurations, shaftULperMM } = pipetteSpecs
  const isInLowVolumeMode =
    transferVolume < liquids.default.minVolume && 'lowVolumeDefault' in liquids
  const { bottom, blowout } = isInLowVolumeMode
    ? plungerPositionsConfigurations.lowVolumeDefault ??
      plungerPositionsConfigurations.default
    : plungerPositionsConfigurations.default
  // absolute value to account for flipped z-axis on OT-2 vs. Flex pipettes
  return round(Math.abs(blowout - bottom) * shaftULperMM, 1)
}
