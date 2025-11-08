import { getPipetteModelSpecs, getPipetteSpecsV2 } from '@opentrons/shared-data'

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

  // If it's a PipetteModel (contains 'v'), convert to PipetteName first
  let pipetteName: PipetteName | undefined
  if (name && name.includes('v')) {
    // This is a PipetteModel, get the PipetteName from it
    const modelSpecs = getPipetteModelSpecs(name as PipetteModel)
    pipetteName = modelSpecs?.name as PipetteName
  } else {
    pipetteName = name as PipetteName
  }

  const pipetteSpecs = getPipetteSpecsV2(pipetteName)

  if (pipetteSpecs == null) {
    return null
  }

  const brandedDisplayName = pipetteSpecs.displayName
  const anonymizedDisplayName = pipetteSpecs.displayName.replace('Flex ', '')

  const displayName = isOEMMode ? anonymizedDisplayName : brandedDisplayName

  return { ...pipetteSpecs, displayName }
}
