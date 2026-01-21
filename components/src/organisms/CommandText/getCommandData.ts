import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { CommandTextData } from './useCommandTextString'

export function getCommandTextData(
  protocolData: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  protocolCommands?: RunTimeCommand[]
): CommandTextData {
  const { pipettes, labware, modules, liquids } = protocolData
  const commands =
    'commands' in protocolData
      ? protocolData.commands
      : (protocolCommands ?? [])
  return { commands, pipettes, labware, modules, liquids }
}
