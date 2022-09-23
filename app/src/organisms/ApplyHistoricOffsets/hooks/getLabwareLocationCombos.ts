import { getLabwareDefURI } from '@opentrons/shared-data'
import { LabwareLocation } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { ProtocolAnalysisOutput, LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'

interface LabwareLocationCombo {
  location: LabwareLocation
  definitionUri: string
}

export function getLabwareLocationCombos(
  commands: RunTimeCommand[],
  labware: ProtocolAnalysisOutput['labware'],
): LabwareLocationCombo[] {
  return commands.reduce<LabwareLocationCombo[]>((acc, command) => {
    if (command.commandType === 'loadLabware') {
      const definitionUri = getLabwareDefURI(command.result.definition)
      return [...acc, { location: command.params.location, definitionUri }]
    } else if (command.commandType === 'moveLabware') {
      const labwareEntity = labware.find(l => l.id === command.params.labwareId)
      if (labwareEntity == null) {
        console.warn('moveLabware command specified a labwareId that could not be found in the labware entities')
        return acc
      }
      return [...acc, { location: command.params.newLocation, definitionUri: labwareEntity.definitionUri }]
    } else {
      return acc
    }
  }, [])
}
