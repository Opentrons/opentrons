import reduce from 'lodash/reduce'

import type { AttachedModule } from '../../../redux/modules/types'

import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useRobot,
} from '.'

export interface ModuleMatchResults {
  missingModuleIds: string[]
  remainingAttachedModules: AttachedModule[]
}

// get requested protocol module ids that do not map to a robot-attached module of the requested model
export function useUnmatchedModulesForProtocol(
  robotName: string,
  runId: string
): ModuleMatchResults {
  const robot = useRobot(robotName)
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const attachedModules = useAttachedModules(robotName)
  if (robot === null) {
    return { missingModuleIds: [], remainingAttachedModules: [] }
  }

  const { missingModuleIds, remainingAttachedModules } = reduce<
    typeof moduleRenderInfoById,
    ModuleMatchResults
  >(
    moduleRenderInfoById,
    (acc, { moduleDef }, id) => {
      const { model, compatibleWith } = moduleDef
      // for this required module, find a remaining (unmatched) attached module of the requested model
      const moduleTypeMatchIndex = acc.remainingAttachedModules.findIndex(
        attachedModule => {
          return (
            model === attachedModule.model ||
            compatibleWith.includes(attachedModule.model)
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
