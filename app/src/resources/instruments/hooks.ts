import {
  getGripperDisplayName,
  getPipetteModelSpecs,
  getPipetteNameSpecs,
  GRIPPER_MODELS,
} from '@opentrons/shared-data'
import { useIsOEMMode } from '../robot-settings/hooks'

import type {
  GripperModel,
  PipetteModel,
  PipetteModelSpecs,
  PipetteName,
  PipetteNameSpecs,
} from '@opentrons/shared-data'

export function usePipetteNameSpecs(
  name: PipetteName
): PipetteNameSpecs | null {
  const isOEMMode = useIsOEMMode()
  const pipetteNameSpecs = getPipetteNameSpecs(name)

  if (pipetteNameSpecs == null) return null

  const brandedDisplayName = pipetteNameSpecs.displayName
  const anonymizedDisplayName = pipetteNameSpecs.displayName.replace(
    'Flex ',
    ''
  )

  const displayName = isOEMMode ? anonymizedDisplayName : brandedDisplayName

  return { ...pipetteNameSpecs, displayName }
}

export function usePipetteModelSpecs(
  model: PipetteModel
): PipetteModelSpecs | null {
  const modelSpecificFields = getPipetteModelSpecs(model)
  const pipetteNameSpecs = usePipetteNameSpecs(
    modelSpecificFields?.name as PipetteName
  )

  if (modelSpecificFields == null || pipetteNameSpecs == null) return null

  return { ...modelSpecificFields, displayName: pipetteNameSpecs.displayName }
}

export function useGripperDisplayName(gripperModel: GripperModel): string {
  const isOEMMode = useIsOEMMode()

  let brandedDisplayName = ''

  // check to only call display name helper for a gripper model
  if (GRIPPER_MODELS.includes(gripperModel)) {
    brandedDisplayName = getGripperDisplayName(gripperModel)
  }

  const anonymizedDisplayName = brandedDisplayName.replace('Flex ', '')

  return isOEMMode ? anonymizedDisplayName : brandedDisplayName
}
