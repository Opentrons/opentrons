import { getLoadedModule } from './accessors'

import type { CommandTextData } from '../types'

export function getModuleDisplayLocation(
  commandTextData: Omit<CommandTextData, 'commands'>,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(commandTextData, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
