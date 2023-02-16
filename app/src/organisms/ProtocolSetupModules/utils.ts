import { checkModuleCompatibility } from '@opentrons/shared-data'

import type { LoadedModule, RunTimeCommand } from '@opentrons/shared-data'
import type { AttachedModule } from '../../redux/modules/types'

export type AttachedProtocolModuleMatch = LoadedModule & {
  attachedModuleMatch: AttachedModule | null
}

// some logic copied from useModuleRenderInfoForProtocolById
export function getAttachedProtocolModuleMatches(
  attachedModules: AttachedModule[],
  protocolModulesInLoadOrder: LoadedModule[]
): AttachedProtocolModuleMatch[] {
  const matchedAttachedModules: AttachedModule[] = []
  const attachedProtocolModuleMatches = protocolModulesInLoadOrder.map(
    protocolModule => {
      const compatibleAttachedModule =
        attachedModules.find(
          attachedModule =>
            checkModuleCompatibility(
              attachedModule.moduleModel,
              protocolModule.model
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

// DONT NEED THIS MODULES ALREADY IN ORDER
export function getProtocolModulesInLoadOrder(
  modules: LoadedModule[],
  commands: RunTimeCommand[]
): LoadedModule[] {
  const protocolModulesInLoadOrder = commands
    .filter(command => command.commandType === 'loadModule')
    .map(command => {
      const moduleForCommand = modules.find(
        // assumption: id from LoadedModule and moduleId from command result are the same entity
        // existing helper getModuleInitialLoadInfo compares moduleId from LegacySchemaAdapterOutput to moduleId from command result
        module => command.result.moduleId === module.id
      )
      if (moduleForCommand == null) {
        throw new Error(
          'expected to be able to find module location, but could not'
        )
      }
      return moduleForCommand
    })

  return protocolModulesInLoadOrder
}
