import { useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import { getModuleType } from '@opentrons/shared-data'
import { getAttachedModules } from '../../../redux/modules'
import { getConnectedRobot } from '../../../redux/discovery/selectors'
import type { State } from '../../../redux/types'
import type { AttachedModule } from '../../../redux/modules/types'
import { useModuleRenderInfoById } from '../hooks'

// get moduleId's from protocol that do not have a module of the requested model attached to the robot
export function useMissingModuleIds(): string[] {
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const moduleRenderInfoById = useModuleRenderInfoById()
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robot === null ? null : robot.name)
  )
  if (robot === null) {
    return []
  }

  interface ModuleMatchResults {
    missingModuleIds: string[]
    remainingAttachedModules: AttachedModule[]
  }

  const { missingModuleIds } = reduce<
    typeof moduleRenderInfoById,
    ModuleMatchResults
  >(
    moduleRenderInfoById,
    (acc, { moduleDef }, id) => {
      const { model } = moduleDef
      const moduleTypeMatchIndex = acc.remainingAttachedModules.findIndex(
        attachedModule =>
          getModuleType(model) === getModuleType(attachedModule.model)
      )
      return moduleTypeMatchIndex !== -1
        ? {
            ...acc,
            remainingAttachedModules: acc.remainingAttachedModules.filter(
              (_m, i) => i !== moduleTypeMatchIndex
            ),
          }
        : {
            ...acc,
            missingModuleIds: [...acc.missingModuleIds, id],
          }
    },
    { missingModuleIds: [], remainingAttachedModules: attachedModules }
  )
  return missingModuleIds
}
