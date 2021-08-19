import type {
  JsonProtocolFile,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { LabwarePositionCheckCommand } from '../types'

export const getTwoPipetteWorkflowCommands = (args: {
  primaryPipetteId: string
  secondaryPipetteId: string
  labware: JsonProtocolFile['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: Record<string, FileModule>
}): LabwarePositionCheckCommand[] => {
  return []
}
