import isEqual from 'lodash/isEqual'
import { getLabwareDefURI } from '@opentrons/shared-data'
import type {
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import { LabwareOffsetLocation } from '@opentrons/api-client'

interface LabwareLocationCombo {
  location: LabwareOffsetLocation
  definitionUri: string
}
export function getLabwareLocationCombos(
  commands: RunTimeCommand[],
  labware: ProtocolAnalysisOutput['labware'],
  modules: ProtocolAnalysisOutput['modules']
): LabwareLocationCombo[] {
  return commands.reduce<LabwareLocationCombo[]>((acc, command) => {
    if (command.commandType === 'loadLabware') {
      const definitionUri = getLabwareDefURI(command.result.definition)
      if ('moduleId' in command.params.location) {
        const modLocation = resolveModuleLocation(
          modules,
          command.params.location.moduleId
        )
        return modLocation == null
          ? acc
          : appendLocationComboIfUniq(acc, {
              location: modLocation,
              definitionUri,
            })
      } else {
        return appendLocationComboIfUniq(acc, {
          location: command.params.location,
          definitionUri,
        })
      }
    } else if (command.commandType === 'moveLabware') {
      const labwareEntity = labware.find(l => l.id === command.params.labwareId)
      if (labwareEntity == null) {
        console.warn(
          'moveLabware command specified a labwareId that could not be found in the labware entities'
        )
        return acc
      }

      if ('moduleId' in command.params.newLocation) {
        const modLocation = resolveModuleLocation(
          modules,
          command.params.newLocation.moduleId
        )
        return modLocation == null
          ? acc
          : appendLocationComboIfUniq(acc, {
              location: modLocation,
              definitionUri: labwareEntity.definitionUri,
            })
      } else {
        return appendLocationComboIfUniq(acc, {
          location: command.params.newLocation,
          definitionUri: labwareEntity.definitionUri,
        })
      }
    } else {
      return acc
    }
  }, [])
}

function appendLocationComboIfUniq(
  acc: LabwareLocationCombo[],
  locationCombo: LabwareLocationCombo
): LabwareLocationCombo[] {
  const locationComboAlreadyExists = acc.some(
    combo =>
      isEqual(combo.location, locationCombo.location) &&
      combo.definitionUri === locationCombo.definitionUri
  )
  return locationComboAlreadyExists ? acc : [...acc, locationCombo]
}

function resolveModuleLocation(
  modules: ProtocolAnalysisOutput['modules'],
  moduleId: string
): LabwareOffsetLocation | null {
  const moduleEntity = modules.find(m => m.id === moduleId)
  if (moduleEntity == null) {
    console.warn(
      'command specified a moduleId that could not be found in the module entities'
    )
    return null
  }
  return {
    slotName: moduleEntity.location.slotName,
    moduleModel: moduleEntity.model,
  }
}
