import { getLoadedModule } from "./accessors"

import type { ModuleModel } from '@opentrons/shared-data'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function getModuleModel(analysis: CompletedProtocolAnalysis, moduleId: string): ModuleModel | null {
  const loadedModule = getLoadedModule(analysis, moduleId)
  return loadedModule != null ? loadedModule.model : null
}