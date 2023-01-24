import type { CompletedProtocolAnalysis, LoadedLabware, LoadedModule, LoadedPipette } from '@opentrons/shared-data'

export function getLoadedLabware(analysis: CompletedProtocolAnalysis, labwareId: string): LoadedLabware | undefined {
  // NOTE: old analysis contains a object dictionary of labware entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.labware) ? analysis.labware.find(l => l.id === labwareId) : analysis.labware[labwareId]
}
export function getLoadedPipette(analysis: CompletedProtocolAnalysis, mount: string): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.pipettes) ? analysis.pipettes.find(l => l.mount === mount) : analysis.pipettes[mount]
}
export function getLoadedModule(analysis: CompletedProtocolAnalysis, moduleId: string): LoadedModule | undefined {
  // NOTE: old analysis contains a object dictionary of module entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.modules) ? analysis.modules.find(l => l.id === moduleId) : analysis.modules[moduleId]
}
