import { getLoadedModule } from './accessors'

import type { CommandTextData } from '../types'

export function getModuleDisplayLocation(
  commandTextData: CommandTextData,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(commandTextData, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
