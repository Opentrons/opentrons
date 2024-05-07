import { getLoadedModule } from './accessors'

import type { CommandTextData } from '../types'

export function getModuleDisplayLocation(
  protocolData: CommandTextData,
  moduleId: string
): string {
  const loadedModule = getLoadedModule(protocolData, moduleId)
  return loadedModule != null ? loadedModule.location.slotName : ''
}
