// @flow
import { getLabwareFormat } from './'
import type { LabwareDefinition2 } from '../types'
import type { PipetteNameSpecs } from '../pipettes'

const FORMAT_METADATA = {
  '96Standard': { multichannelAccess: true },
  '384Standard': { multichannelAccess: true },
  trough: { multichannelAccess: true },
  irregular: { multichannelAccess: false },
  trash: { multichannelAccess: true },
}

export const canPipetteUseLabware = (
  pipetteSpec: PipetteNameSpecs,
  labwareDef: LabwareDefinition2
): ?boolean => {
  if (pipetteSpec.channels === 1) {
    return true
  }
  const format = getLabwareFormat(labwareDef)
  return FORMAT_METADATA[format].multichannelAccess
}
