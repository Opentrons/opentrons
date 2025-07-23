import { getTiprackVolume } from '@opentrons/shared-data'

import type { LabwareDefinition, PipetteV2Specs } from '@opentrons/shared-data'

export const getMaxConditioningVolume = (
  transferVolume: number,
  disposalVolume: number,
  tiprack: LabwareDefinition,
  pipetteSpecs: PipetteV2Specs
): number => {
  const { liquids } = pipetteSpecs
  const minVolumeForMultiDispense = transferVolume * 2
  const isInLowVolumeMode =
    minVolumeForMultiDispense < liquids.default.minVolume &&
    'lowVolumeDefault' in liquids

  const tipMaxVolume = tiprack != null ? getTiprackVolume(tiprack) : null

  const maxWorkingVolume = Math.min(
    isInLowVolumeMode
      ? liquids.lowVolumeDefault.maxVolume
      : liquids.default.maxVolume,
    ...(tipMaxVolume != null ? [tipMaxVolume] : [])
  )
  return Math.max(
    0,
    maxWorkingVolume - disposalVolume - minVolumeForMultiDispense
  )
}
