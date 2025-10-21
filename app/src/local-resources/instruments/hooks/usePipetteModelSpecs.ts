import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { usePipetteNameSpecs } from './usePipetteNameSpecs'

import type {
  PipetteModel,
  PipetteModelSpecs,
  PipetteName,
} from '@opentrons/shared-data'

export function usePipetteModelSpecs(
  model: PipetteModel
): PipetteModelSpecs | null {
  const modelSpecificFields = getPipetteModelSpecs(model)
  const pipetteNameSpecs = usePipetteNameSpecs(
    modelSpecificFields?.name as PipetteName
  )

  if (modelSpecificFields == null || pipetteNameSpecs == null) {
    return null
  }

  return { ...modelSpecificFields, displayName: pipetteNameSpecs.displayName }
}
