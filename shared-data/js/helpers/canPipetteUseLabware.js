// @flow
import type { LabwareDefinition2 } from '../types'
import type { PipetteNameSpecs } from '../pipettes'

export const canPipetteUseLabware = (
  pipetteSpec: PipetteNameSpecs,
  labwareDef: LabwareDefinition2
): ?boolean => {
  if (pipetteSpec.channels === 1) {
    // assume all labware can be used by single-channel
    return true
  }

  return false // TODO IMMEDIATELY
}
