import { getLoadedModule } from './getLoadedModule'

import type { LoadedModules } from './types'
import type { ModuleModel } from '@opentrons/shared-data'

export function getModuleModel(
  loadedModules: LoadedModules,
  moduleId: string
): ModuleModel | null {
  const loadedModule = getLoadedModule(loadedModules, moduleId)
  return loadedModule != null ? loadedModule.model : null
}
