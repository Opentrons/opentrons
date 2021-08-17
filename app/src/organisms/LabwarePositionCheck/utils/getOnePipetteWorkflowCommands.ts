import { CommandsByStepNumber } from './getLabwarePositionCheckCommands'
import { JsonProtocolFile, PipetteName } from '@opentrons/shared-data'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV5'

export const getOnePipetteWorkflowCommands = (args: {
  primaryPipette: PipetteName
  labware: JsonProtocolFile['labware']
  commands: Command[]
}): CommandsByStepNumber => {}
