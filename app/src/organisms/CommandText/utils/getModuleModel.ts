import { getLoadedModule } from './accessors'

import type { RunData } from '@opentrons/api-client'
import type {
  ModuleModel,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

export function getModuleModel(
  protocolData: CompletedProtocolAnalysis | RunData,
  moduleId: string
): ModuleModel | null {
  const loadedModule = getLoadedModule(protocolData, moduleId)
  return loadedModule != null ? loadedModule.model : null
}
