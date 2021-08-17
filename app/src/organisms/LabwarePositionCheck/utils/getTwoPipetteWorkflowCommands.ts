import type { JsonProtocolFile, PipetteName } from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { CommandsByStepNumber } from './getLabwarePositionCheckCommands'

export const getTwoPipetteWorkflowCommands = (args: {
  primaryPipette: PipetteName
  secondaryPipette: PipetteName
  labware: JsonProtocolFile['labware']
  commands: Command[]
}): CommandsByStepNumber => {}
