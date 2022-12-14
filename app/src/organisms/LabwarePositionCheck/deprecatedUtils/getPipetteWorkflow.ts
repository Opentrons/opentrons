import uniq from 'lodash/uniq'
import { doesPipetteVisitAllTipracks } from '../utils/doesPipetteVisitAllTipracks'
import type {
  LabwareDefinition2,
  PipetteName,
  LoadedLabware,
} from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

export const getPipetteWorkflow = (args: {
  pipetteNames: PipetteName[]
  primaryPipetteId: string
  labware: LoadedLabware[]
  labwareDefinitions: Record<string, LabwareDefinition2>
  commands: RunTimeCommand[]
}): 1 | 2 => {
  const {
    pipetteNames,
    primaryPipetteId,
    labware,
    labwareDefinitions,
    commands,
  } = args

  const uniquePipetteNames = uniq(pipetteNames)
  if (uniquePipetteNames.length === 1) {
    return 1
  }

  if (
    doesPipetteVisitAllTipracks(
      primaryPipetteId,
      labware,
      labwareDefinitions,
      commands
    )
  ) {
    return 1
  }

  return 2
}
