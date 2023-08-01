import isEqual from 'lodash/isEqual'
import { getLabwareDefURI } from '@opentrons/shared-data'
import type {
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import { LabwareOffsetLocation } from '@opentrons/api-client'

export interface LabwareLocationCombo {
  location: LabwareOffsetLocation
  definitionUri: string
  labwareId: string
  moduleId?: string
}
export function getLabwareLocationCombos(
  commands: RunTimeCommand[],
  labware: ProtocolAnalysisOutput['labware'],
  modules: ProtocolAnalysisOutput['modules']
): LabwareLocationCombo[] {
  return commands.reduce<LabwareLocationCombo[]>((acc, command) => {
    if (command.commandType === 'loadLabware') {
      if (command.result?.definition == null) return acc
      if (command.result.definition.parameters.format === 'trash') return acc
      const definitionUri = getLabwareDefURI(command.result.definition)
      if (command.params.location === 'offDeck') {
        return acc
      } else if ('moduleId' in command.params.location) {
        const { moduleId } = command.params.location
        const modLocation = resolveModuleLocation(modules, moduleId)
        return modLocation == null
          ? acc
          : appendLocationComboIfUniq(acc, {
              location: modLocation,
              definitionUri,
              labwareId: command.result.labwareId,
              moduleId,
            })
      } else {
        return appendLocationComboIfUniq(acc, {
          location: command.params.location,
          definitionUri,
          labwareId: command.result.labwareId,
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
      if (command.params.newLocation === 'offDeck') {
        return acc
      } else if ('moduleId' in command.params.newLocation) {
        const modLocation = resolveModuleLocation(
          modules,
          command.params.newLocation.moduleId
        )
        return modLocation == null
          ? acc
          : appendLocationComboIfUniq(acc, {
              location: modLocation,
              definitionUri: labwareEntity.definitionUri,
              labwareId: command.params.labwareId,
              moduleId: command.params.newLocation.moduleId,
            })
      } else {
        return appendLocationComboIfUniq(acc, {
          location: command.params.newLocation,
          definitionUri: labwareEntity.definitionUri,
          labwareId: command.params.labwareId,
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
      combo.labwareId === locationCombo.labwareId &&
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
