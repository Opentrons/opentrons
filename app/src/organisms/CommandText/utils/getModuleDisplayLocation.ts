import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

import { getLoadedModule } from './accessors'

export function getModuleDisplayLocation(
  analysis: CompletedProtocolAnalysis,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(analysis, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
