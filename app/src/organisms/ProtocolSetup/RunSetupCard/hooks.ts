import { useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import { getModuleType } from '@opentrons/shared-data'
import { getAttachedModules } from '../../../redux/modules'
import { getConnectedRobot } from '../../../redux/discovery/selectors'
import type { State } from '../../../redux/types'
import type { AttachedModule } from '../../../redux/modules/types'
import { useModuleRenderInfoById } from '../hooks'

interface MissingModules {
  missingModuleIds: string[]
}
export function useMissingModuleIds(): MissingModules {
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const moduleRenderInfoById = useModuleRenderInfoById()
  let robotName = ''
  if (robot != null) {
    robotName = robot.name
  }
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

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
  return { missingModuleIds }
}
