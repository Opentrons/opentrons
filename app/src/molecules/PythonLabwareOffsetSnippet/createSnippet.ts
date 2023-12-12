import isEqual from 'lodash/isEqual'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'
import { getLabwareDefinitionUri } from '../../organisms/Devices/ProtocolRun/utils/getLabwareDefinitionUri'
import { LabwareOffset } from '@opentrons/api-client'
import { getLabwareOffsetLocation } from '../../organisms/Devices/ProtocolRun/utils/getLabwareOffsetLocation'
import type {
  LoadedLabware,
  LoadedModule,
  RunTimeCommand,
} from '@opentrons/shared-data'

const PYTHON_INDENT = '    '
const JUPYTER_PREFIX =
  'import opentrons.execute\nprotocol = opentrons.execute.get_protocol_api("2.13")\n\n'
const CLI_PREFIX = `from opentrons import protocol_api\n\nmetadata = {\n${PYTHON_INDENT}"apiLevel": "2.13"\n}\n\ndef run(protocol: protocol_api.ProtocolContext):`

export function createSnippet(
  mode: 'jupyter' | 'cli',
  commands: RunTimeCommand[],
  labware: LoadedLabware[],
  modules: LoadedModule[],
  labwareOffsets?: Array<Omit<LabwareOffset, 'createdAt' | 'id'>>
): string | null {
  let moduleVariableById: { [moduleId: string]: string } = {}
  let labwareCount = 0
  const loadCommandLines = commands.reduce<string[]>((acc, command) => {
    let loadStatement = ''
    let addendum = null
    if (command.commandType === 'loadLabware') {
      labwareCount = labwareCount + 1
      const loadedLabware = labware.find(
        item => item.id === command.result?.labwareId
      )
      if (loadedLabware == null) return acc
      const labwareDefinitions = getLoadedLabwareDefinitionsByUri(commands)
      const { loadName } = labwareDefinitions[
        loadedLabware.definitionUri
      ].parameters
      if (command.params.location === 'offDeck') {
        loadStatement = `labware_${labwareCount} = protocol.load_labware("${String(
          loadName
        )}", location="offDeck")`
      } else if ('slotName' in command.params.location) {
        // load labware on deck
        const { slotName } = command.params.location
        loadStatement = `labware_${labwareCount} = protocol.load_labware("${String(
          loadName
        )}", location="${String(slotName)}")`
      } else if ('moduleId' in command.params.location) {
        // load labware on module
        const moduleVariable =
          moduleVariableById[command.params.location.moduleId]
        loadStatement = `labware_${labwareCount} = ${moduleVariable}.load_labware("${String(
          loadName
        )}")`
      } else if ('labwareId' in command.params.location) {
        //  TODO: (jr, 8/16/23): THIS SHOULDN"T BE labwareId!!! Need to update to the python variable
        //  we are storing the LabwareContext of the loaded adapter onto
      }

      const labwareDefUri = getLabwareDefinitionUri(
        command.result?.labwareId ?? '',
        labware,
        labwareDefinitions
      )
      const offsetLocation = getLabwareOffsetLocation(
        command.result?.labwareId ?? '',
        commands,
        modules,
        labware
      )

      const labwareOffset = labwareOffsets?.find(offset => {
        return (
          offset.definitionUri === labwareDefUri &&
          isEqual(offset.location, offsetLocation)
        )
      })
      if (labwareOffset == null) {
        addendum = [loadStatement, '']
      } else {
        const { x, y, z } = labwareOffset.vector
        addendum = [
          loadStatement,
          `labware_${labwareCount}.set_offset(x=${String(
            x.toFixed(2)
          )}, y=${String(y.toFixed(2))}, z=${String(z.toFixed(2))})`,
          '',
        ]
      }
    } else if (command.commandType === 'loadModule') {
      if (command.result == null) return acc
      // load module on deck
      const moduleVariable = `module_${
        Object.keys(moduleVariableById).length + 1
      }`
      moduleVariableById = {
        ...moduleVariableById,
        [command.result.moduleId]: moduleVariable,
      }
      const { model } = command.params
      const { slotName } = command.params.location
      addendum = [
        `${moduleVariable} = protocol.load_module("${String(
          model
        )}", location="${String(slotName)}")`,
        '',
      ]
    }

    return addendum != null ? [...acc, ...addendum] : acc
  }, [])

  return loadCommandLines.reduce<string>((acc, line) => {
    if (mode === 'jupyter') {
      return `${String(acc)}\n${String(line)}`
    } else {
      return `${String(acc)}\n${PYTHON_INDENT}${String(line)}`
    }
  }, `${mode === 'jupyter' ? JUPYTER_PREFIX : CLI_PREFIX}`)
}
