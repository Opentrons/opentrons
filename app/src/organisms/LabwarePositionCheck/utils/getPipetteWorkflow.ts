import { JsonProtocolFile, PipetteName } from '@opentrons/shared-data'
import { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV5'

// determines pre run check workflow 1 or 2
export const getPipetteWorkflow = (args: {
  pipettes: FilePipette[]
  primaryPipette: PipetteName
  labware: JsonProtocolFile['labware']
  commands: Command[]
}): 1 | 2 => {}
