import { getLoadedModule } from './accessors'

import type { ModuleModel } from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getModuleModel(
  protocolData: CommandTextData,
  moduleId: string
): ModuleModel | null {
  const loadedModule = getLoadedModule(protocolData, moduleId)
  return loadedModule != null ? loadedModule.model : null
}
