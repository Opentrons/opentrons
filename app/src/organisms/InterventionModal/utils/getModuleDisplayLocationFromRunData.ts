import type { RunData } from '@opentrons/api-client'
import { getLoadedModule } from '@opentrons/components'

export function getModuleDisplayLocationFromRunData(
  protocolData: RunData,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(protocolData.modules, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
