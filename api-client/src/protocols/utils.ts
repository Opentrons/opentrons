// set of functions that parse details out of a protocol record and it's internals
import sortedUniqBy from 'lodash/sortedUniqBy'
import keyBy from 'lodash/keyBy'

import type { PipetteName, ModuleModel } from '@opentrons/shared-data'
import type {
  ProtocolFile,
  RunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
  LoadPipetteRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface PipetteNamesByMount {
  left: PipetteName | null
  right: PipetteName | null
}
export function parseInitialPipetteNamesByMount(
  analysis: ProtocolFile<{}>
): PipetteNamesByMount {
  const { commands, pipettes } = analysis
  const rightPipetteId = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )?.result.pipetteId
  const leftPipetteId = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )?.result.pipetteId
  return {
    left: leftPipetteId != null ? pipettes[leftPipetteId].name : null,
    right: rightPipetteId != null ? pipettes[rightPipetteId].name : null,
  }
}

export function parseAllRequiredModuleModels(
  analysis: ProtocolFile<{}>
): ModuleModel[] {
  return Object.entries(analysis.modules).map(([_moduleId, { model }]) => model)
}

interface LoadedEquipmentBySlot {
  [slotId: string]: LoadLabwareRunTimeCommand | LoadModuleRunTimeCommand
}
export function parseInitialLoadedEquipmentBySlot(
  analysis: ProtocolFile<{}>
): LoadedLabwareBySlot {
  const loadLabwareCommandsReversed = analysis.commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reverse()
  const labwareBySlot = keyBy<LoadLabwareRunTimeCommand>(
    loadLabwareCommandsReversed
    command => {
      const {location} = command.params
      if ('slotName' in location){
        return location.slotName
      }  else {
        const slotName = analysis.commands.find((command): command is LoadModuleRunTimeCommand => command.commandType === 'loadModule' && command.params.moduleId === location.moduleId)?.params.location.slotName
        if (slotName == null) console.warn(`could not find module with id ${location.moduleId} for labware id ${command.params.labwareId} to be loaded into`)
        else return slotName
      }
  )

}
