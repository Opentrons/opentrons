import { checkModuleCompatibility } from '@opentrons/shared-data'

import type { ProtocolModuleInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import type { AttachedModule } from '../../redux/modules/types'

export type AttachedProtocolModuleMatch = ProtocolModuleInfo & {
  attachedModuleMatch: AttachedModule | null
}

// some logic copied from useModuleRenderInfoForProtocolById
export function getAttachedProtocolModuleMatches(
  attachedModules: AttachedModule[],
  protocolModulesInLoadOrder: ProtocolModuleInfo[]
): AttachedProtocolModuleMatch[] {
  const matchedAttachedModules: AttachedModule[] = []
  const attachedProtocolModuleMatches = protocolModulesInLoadOrder.map(
    protocolModule => {
      const compatibleAttachedModule =
        attachedModules.find(
          attachedModule =>
            checkModuleCompatibility(
              attachedModule.moduleModel,
              protocolModule.moduleDef.model
            ) &&
            // check id instead of object reference in useModuleRenderInfoForProtocolById
            matchedAttachedModules.find(
              matchedAttachedModule =>
                matchedAttachedModule.id === attachedModule.id
            ) == null
        ) ?? null
      if (compatibleAttachedModule !== null) {
        matchedAttachedModules.push(compatibleAttachedModule)
        return {
          ...protocolModule,
          attachedModuleMatch: compatibleAttachedModule,
        }
      }
      return {
        ...protocolModule,
        attachedModuleMatch: null,
      }
    }
  )
  return attachedProtocolModuleMatches
}
