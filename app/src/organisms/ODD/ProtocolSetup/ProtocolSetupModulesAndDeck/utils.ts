import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  NON_CONNECTING_MODULE_TYPES,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { AttachedModule } from '@opentrons/api-client'
import type { ProtocolModuleInfo } from '/app/transformations/analysis'

interface UnmatchedModuleResults {
  missingModuleIds: string[]
  remainingAttachedModules: AttachedModule[]
}

// get requested protocol module ids that do not map to a robot-attached module of the requested model
// some logic copied from useUnmatchedModulesForProtocol
export function getUnmatchedModulesForProtocol(
  attachedModules: AttachedModule[],
  protocolModulesInfo: ProtocolModuleInfo[]
): UnmatchedModuleResults {
  const { missingModuleIds, remainingAttachedModules } =
    protocolModulesInfo.reduce<UnmatchedModuleResults>(
      (acc, module) => {
        const { model, compatibleWith } = module.moduleDef
        // Skip matching any modules that don't require an electronic robot connection
        if (NON_CONNECTING_MODULE_TYPES.includes(getModuleType(model))) {
          return acc
        }
        // for this required module, find a remaining (unmatched) attached module of the requested model
        const moduleTypeMatchIndex = acc.remainingAttachedModules.findIndex(
          attachedModule => {
            return (
              model === attachedModule.moduleModel ||
              compatibleWith.includes(attachedModule.moduleModel)
            )
          }
        )
        return moduleTypeMatchIndex !== -1
          ? {
              ...acc,
              // remove matched module from remaining modules list
              remainingAttachedModules: acc.remainingAttachedModules.filter(
                (_remainingAttachedModule, index) =>
                  index !== moduleTypeMatchIndex
              ),
            }
          : {
              ...acc,
              // append unmatchable module to list of requested modules that are missing a physical match
              missingModuleIds: [...acc.missingModuleIds, module.moduleId],
            }
      },
      { missingModuleIds: [], remainingAttachedModules: attachedModules }
    )
  return { missingModuleIds, remainingAttachedModules }
}

export const getDoesModuleRequireCalibration = (
  attachedModule: AttachedModule
): boolean => {
  const { moduleType, moduleOffset } = attachedModule
  switch (moduleType) {
    case ABSORBANCE_READER_TYPE:
    case VACUUM_MODULE_TYPE:
    case FLEX_STACKER_MODULE_TYPE:
      return false
    case TEMPERATURE_MODULE_TYPE:
    case THERMOCYCLER_MODULE_TYPE:
    case HEATERSHAKER_MODULE_TYPE:
    case MAGNETIC_MODULE_TYPE:
      return moduleOffset?.last_modified == null
    // should not hit
    default:
      console.log(`unknown module type: ${moduleType}`)
      return false
  }
}
