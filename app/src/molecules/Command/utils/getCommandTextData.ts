import type { LegacyGoodRunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getCommandTextData(
  protocolData: CompletedProtocolAnalysis | LegacyGoodRunData,
  protocolCommands?: RunTimeCommand[]
): CommandTextData {
  const { pipettes, labware, modules, liquids } = protocolData
  const commands =
    'commands' in protocolData ? protocolData.commands : protocolCommands ?? []
  return { commands, pipettes, labware, modules, liquids }
}
