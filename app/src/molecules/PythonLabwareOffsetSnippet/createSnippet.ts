import { getLabwareDefinitionUri } from '../../organisms/ProtocolSetup/utils/getLabwareDefinitionUri'
import type { ProtocolFile } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

const PYTHON_INDENT = '    '
const JUPYTER_PREFIX =
  'import opentrons.execute\nprotocol = opentrons.execute.get_protocol_api("2.12")\n\n'
const CLI_PREFIX = `from opentrons import protocol_api\n\nmetadata = {\n${PYTHON_INDENT}"apiLevel": "2.12"\n}\n\ndef run(protocol: protocol_api.ProtocolContext):`

export function createSnippet(
  mode: 'jupyter' | 'cli',
  protocol: ProtocolFile<{}>,
  labwareOffsets?: LabwareOffset[]
): string | null {
  let moduleVariableById: { [moduleId: string]: string } = {}
  const loadCommandLines = protocol.commands.reduce<string[]>(
    (acc, command, index) => {
      let loadStatement = ''
      let addendum = null
      if (command.commandType === 'loadLabware') {
        const loadedLabware = protocol.labware[command.result.labwareId]
        if (loadedLabware == null) return acc
        const { loadName } = protocol.labwareDefinitions[
          loadedLabware.definitionId
        ].parameters
        if ('slotName' in command.params.location) {
          // load labware on deck
          const { slotName } = command.params.location
          loadStatement = `labware_${index} = protocol.load_labware("${loadName}", location="${slotName}")`
        } else if ('moduleId' in command.params.location) {
          // load labware on module
          const moduleVariable =
            moduleVariableById[command.params.location.moduleId]
          loadStatement = `labware_${index} = ${moduleVariable}.load_labware("${loadName}")`
        }
        const labwareDefUri = getLabwareDefinitionUri(
          command.result.labwareId,
          protocol.labware
        )
        const labwareOffset = labwareOffsets?.find(
          offset => offset.definitionUri === labwareDefUri
        )
        if (labwareOffset == null) {
          addendum = [loadStatement, '']
        } else {
          const { x, y, z } = labwareOffset.vector
          addendum = [
            loadStatement,
            `labware_${index}.set_offset(x=${x}, y=${y}, z=${z})`,
            '',
          ]
        }
      } else if (command.commandType === 'loadModule') {
        // load module on deck
        const moduleVariable = `module_${index}`
        moduleVariableById = {
          ...moduleVariableById,
          [command.result.moduleId]: moduleVariable,
        }
        const { model } = protocol.modules[command.params.moduleId]
        const { slotName } = command.params.location
        addendum = [
          `${moduleVariable} = protocol.load_module("${model}", location="${slotName}")`,
          '',
        ]
      }

      return addendum != null ? [...acc, ...addendum] : acc
    },
    []
  )
  return loadCommandLines.reduce<string>((acc, line) => {
    if (mode === 'jupyter') {
      return `${acc}\n${line}`
    } else {
      return `${acc}\n${PYTHON_INDENT}${line}`
    }
  }, `${mode === 'jupyter' ? JUPYTER_PREFIX : CLI_PREFIX}`)
}
