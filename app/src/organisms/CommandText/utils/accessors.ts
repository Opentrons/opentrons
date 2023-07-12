import type { RunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
} from '@opentrons/shared-data'

export function getLoadedLabware(
  protocolData: CompletedProtocolAnalysis | RunData,
  labwareId: string
): LoadedLabware | undefined {
  // NOTE: old analysis contains a object dictionary of labware entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(protocolData.labware)
    ? protocolData.labware.find(l => l.id === labwareId)
    : protocolData.labware[labwareId]
}
export function getLoadedPipette(
  analysis: CompletedProtocolAnalysis,
  mount: string
): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.pipettes)
    ? analysis.pipettes.find(l => l.mount === mount)
    : analysis.pipettes[mount]
}
export function getLoadedModule(
  protocolData: CompletedProtocolAnalysis | RunData,
  moduleId: string
): LoadedModule | undefined {
  // NOTE: old analysis contains a object dictionary of module entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(protocolData.modules)
    ? protocolData.modules.find(l => l.id === moduleId)
    : protocolData.modules[moduleId]
}
