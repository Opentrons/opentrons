import uniq from 'lodash/uniq'
import { doesPipetteVisitAllTipracks } from './doesPipetteVisitAllTipracks'
import type {
  JsonProtocolFile,
  LabwareDefinition2,
  PipetteName,
} from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'

export const getPipetteWorkflow = (args: {
  pipetteNames: PipetteName[]
  primaryPipetteId: string
  labware: JsonProtocolFile['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  commands: Command[]
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
