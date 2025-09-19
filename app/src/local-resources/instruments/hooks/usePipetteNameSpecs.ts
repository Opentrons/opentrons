import { getPipetteNameSpecs } from '@opentrons/shared-data'

import { useIsOEMMode } from '/app/resources/robot-settings'

import type { PipetteName, PipetteNameSpecs } from '@opentrons/shared-data'

export function usePipetteNameSpecs(
  name: PipetteName
): PipetteNameSpecs | null {
  const isOEMMode = useIsOEMMode()
  const pipetteNameSpecs = getPipetteNameSpecs(name)

  if (pipetteNameSpecs == null) {
    return null
  }

  const brandedDisplayName = pipetteNameSpecs.displayName
  const anonymizedDisplayName = pipetteNameSpecs.displayName.replace(
    'Flex ',
    ''
  )

  const displayName = isOEMMode ? anonymizedDisplayName : brandedDisplayName

  return { ...pipetteNameSpecs, displayName }
}
