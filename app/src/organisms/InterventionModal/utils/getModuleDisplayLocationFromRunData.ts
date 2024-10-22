import { getLoadedModule } from '/app/local-resources/modules'

import type { RunData } from '@opentrons/api-client'

export function getModuleDisplayLocationFromRunData(
  protocolData: RunData,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(protocolData.modules, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
