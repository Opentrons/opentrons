import { useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import { getAttachedModules } from '../../../../redux/modules'
import { getConnectedRobot } from '../../../../redux/discovery/selectors'
import type { State } from '../../../../redux/types'
import type { AttachedModule } from '../../../../redux/modules/types'
import { useModuleRenderInfoById } from '../../hooks'

interface ModuleMatchResults {
  missingModuleIds: string[]
  remainingAttachedModules: AttachedModule[]
}

// get requested protocol moduleId's that do map to a robot attached modulemodule of the requested model
export function useMissingModuleIds(): string[] {
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const moduleRenderInfoById = useModuleRenderInfoById()
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robot === null ? null : robot.name)
  )
  if (robot === null) {
    return []
  }

  const { missingModuleIds } = reduce<
    typeof moduleRenderInfoById,
    ModuleMatchResults
  >(
    moduleRenderInfoById,
    (acc, { moduleDef }, id) => {
      const { model } = moduleDef
      // for this required module, find a remaining (unmatched) attached module of the requested model
      const moduleTypeMatchIndex = acc.remainingAttachedModules.findIndex(
        attachedModule => model === attachedModule.model
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
  return missingModuleIds
}
