import { getLoadedModule } from '../../../molecules/Command/utils/accessors'

import type { RunData } from '@opentrons/api-client'

export function getModuleDisplayLocationFromRunData(
  protocolData: RunData,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(protocolData, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
