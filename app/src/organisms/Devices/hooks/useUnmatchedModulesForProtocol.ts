import reduce from 'lodash/reduce'

import type { AttachedModule } from '../../../redux/modules/types'

import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useRobot,
} from '.'
import {
  NON_CONNECTING_MODULE_TYPES,
  getModuleType,
} from '@opentrons/shared-data'

interface UnmatchedModuleResults {
  missingModuleIds: string[]
  remainingAttachedModules: AttachedModule[]
}

// get requested protocol module ids that do not map to a robot-attached module of the requested model
export function useUnmatchedModulesForProtocol(
  robotName: string,
  runId: string
): UnmatchedModuleResults {
  const robot = useRobot(robotName)
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const attachedModules = useAttachedModules()
  if (robot === null) {
    return { missingModuleIds: [], remainingAttachedModules: [] }
  }

  const { missingModuleIds, remainingAttachedModules } = reduce<
    typeof moduleRenderInfoById,
    UnmatchedModuleResults
  >(
    moduleRenderInfoById,
    (acc, { moduleDef }, id) => {
      const { model, compatibleWith } = moduleDef
      // Skip matching any modules that don't require an electronic robot connection
      if (NON_CONNECTING_MODULE_TYPES.includes(getModuleType(model))) return acc
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
            missingModuleIds: [...acc.missingModuleIds, id],
          }
    },
    { missingModuleIds: [], remainingAttachedModules: attachedModules }
  )
  return { missingModuleIds, remainingAttachedModules }
}
