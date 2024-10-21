import { getPipetteSpecsV2 } from '@opentrons/shared-data'

import { useIsOEMMode } from '/app/resources/robot-settings'

import type {
  PipetteModel,
  PipetteName,
  PipetteV2Specs,
} from '@opentrons/shared-data'

export function usePipetteSpecsV2(
  name?: PipetteName | PipetteModel
): PipetteV2Specs | null {
  const isOEMMode = useIsOEMMode()
  const pipetteSpecs = getPipetteSpecsV2(name)

  if (pipetteSpecs == null) {
    return null
  }

  const brandedDisplayName = pipetteSpecs.displayName
  const anonymizedDisplayName = pipetteSpecs.displayName.replace('Flex ', '')

  const displayName = isOEMMode ? anonymizedDisplayName : brandedDisplayName

  return { ...pipetteSpecs, displayName }
}
