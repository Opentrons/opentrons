import type {
  JsonProtocolFile,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { LabwarePositionCheckStep } from '../types'

export const getTwoPipettePositionCheckSteps = (args: {
  primaryPipetteId: string
  secondaryPipetteId: string
  labware: JsonProtocolFile['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: Record<string, FileModule>
}): LabwarePositionCheckStep[] => {
  return []
}
