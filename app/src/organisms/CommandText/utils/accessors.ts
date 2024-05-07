import type { RunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
} from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getLoadedLabware(
  protocolData: CompletedProtocolAnalysis | RunData | CommandTextData,
  labwareId: string
): LoadedLabware | undefined {
  // NOTE: old analysis contains a object dictionary of labware entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(protocolData.labware)
    ? protocolData.labware.find(l => l.id === labwareId)
    : protocolData.labware[labwareId]
}
export function getLoadedPipette(
  protocolData: CommandTextData,
  mount: string
): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(protocolData.pipettes)
    ? protocolData.pipettes.find(l => l.mount === mount)
    : protocolData.pipettes[mount]
}
export function getLoadedModule(
  protocolData: CompletedProtocolAnalysis | RunData | CommandTextData,
  moduleId: string
): LoadedModule | undefined {
  // NOTE: old analysis contains a object dictionary of module entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(protocolData.modules)
    ? protocolData.modules.find(l => l.id === moduleId)
    : protocolData.modules[moduleId]
}
