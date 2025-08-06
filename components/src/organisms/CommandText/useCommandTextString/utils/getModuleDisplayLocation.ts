import { FLEX_STACKER_MODULE_TYPE, getModuleType } from '@opentrons/shared-data'

import { getLoadedModule } from './getLoadedModule'

import type { LoadedModules } from './types'

export function getModuleDisplayLocation(
  loadedModules: LoadedModules,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(loadedModules, moduleId)
  if (loadedModule == null) {
    console.warn(`Module with ID ${moduleId} not found in loaded modules`)
    return ''
  }
  const slotName = loadedModule.location.slotName
  return getModuleType(loadedModule.model) === FLEX_STACKER_MODULE_TYPE
    ? `${slotName[0]}4`
    : slotName
}
