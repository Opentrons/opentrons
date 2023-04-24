import { getLoadedModule } from './accessors'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function getModuleDisplayLocation(
  analysis: CompletedProtocolAnalysis,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(analysis, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
