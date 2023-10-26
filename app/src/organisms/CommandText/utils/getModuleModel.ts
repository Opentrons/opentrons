import { getLoadedModule } from './accessors'

import type {
  ModuleModel,
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

export function getModuleModel(
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  moduleId: string
): ModuleModel | null {
  const loadedModule = getLoadedModule(analysis, moduleId)
  return loadedModule != null ? loadedModule.model : null
}
