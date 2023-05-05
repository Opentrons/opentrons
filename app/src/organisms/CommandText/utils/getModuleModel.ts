import type {
  ModuleModel,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

import { getLoadedModule } from './accessors'

export function getModuleModel(
  analysis: CompletedProtocolAnalysis,
  moduleId: string
): ModuleModel | null {
  const loadedModule = getLoadedModule(analysis, moduleId)
  return loadedModule != null ? loadedModule.model : null
}
