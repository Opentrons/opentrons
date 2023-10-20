import { getLoadedModule } from './accessors'

import type { CompletedProtocolAnalysis, ProtocolAnalysisOutput } from '@opentrons/shared-data'

export function getModuleDisplayLocation(
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(analysis, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
