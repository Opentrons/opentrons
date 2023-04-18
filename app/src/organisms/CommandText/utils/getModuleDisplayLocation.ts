import { getLoadedModule } from './accessors'

import type { RunData } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function getModuleDisplayLocation(
  protocolData: CompletedProtocolAnalysis | RunData,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(protocolData, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
