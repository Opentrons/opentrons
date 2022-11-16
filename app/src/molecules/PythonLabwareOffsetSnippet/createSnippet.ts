import isEqual from 'lodash/isEqual'
import { getLabwareDefinitionUri } from '../../organisms/Devices/ProtocolRun/utils/getLabwareDefinitionUri'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'
import { getLabwareOffsetLocation } from '../../organisms/Devices/ProtocolRun/utils/getLabwareOffsetLocation'

const PYTHON_INDENT = '    '
const JUPYTER_PREFIX =
  'import opentrons.execute\nprotocol = opentrons.execute.get_protocol_api("2.12")\n\n'
const CLI_PREFIX = `from opentrons import protocol_api\n\nmetadata = {\n${PYTHON_INDENT}"apiLevel": "2.12"\n}\n\ndef run(protocol: protocol_api.ProtocolContext):`

export function createSnippet(
  mode: 'jupyter' | 'cli',
  protocol: LegacySchemaAdapterOutput,
  labwareOffsets?: LabwareOffset[]
): string | null {
  let moduleVariableById: { [moduleId: string]: string } = {}
  let labwareCount = 0
  const loadCommandLines = protocol.commands.reduce<string[]>(
    (acc, command) => {
      let loadStatement = ''
      let addendum = null
      if (command.commandType === 'loadLabware') {
        labwareCount = labwareCount + 1
        const loadedLabware = protocol.labware.find(
          item => item.id === command.result.labwareId
        )
        if (loadedLabware == null) return acc
        const { loadName } = protocol.labwareDefinitions[
          loadedLabware.definitionUri
        ].parameters
        if (command.params.location === 'offDeck') {
          loadStatement = `labware_${labwareCount} = protocol.load_labware("${loadName}", location="offDeck")`
        } else if ('slotName' in command.params.location) {
          // load labware on deck
          const { slotName } = command.params.location
          loadStatement = `labware_${labwareCount} = protocol.load_labware("${loadName}", location="${slotName}")`
        } else if ('moduleId' in command.params.location) {
          // load labware on module
          const moduleVariable =
            moduleVariableById[command.params.location.moduleId]
          loadStatement = `labware_${labwareCount} = ${moduleVariable}.load_labware("${loadName}")`
        }
        const labwareDefUri = getLabwareDefinitionUri(
          command.result.labwareId,
          protocol.labware,
          protocol.labwareDefinitions
        )

        const offsetLocation = getLabwareOffsetLocation(
          command.result.labwareId,
          protocol.commands,
          protocol.modules
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
            `labware_${labwareCount}.set_offset(x=${x.toFixed(
              2
            )}, y=${y.toFixed(2)}, z=${z.toFixed(2)})`,
            '',
          ]
        }
      } else if (command.commandType === 'loadModule') {
        // load module on deck
        const moduleVariable = `module_${
          Object.keys(moduleVariableById).length + 1
        }`
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
