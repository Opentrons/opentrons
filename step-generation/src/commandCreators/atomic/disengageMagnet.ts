import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { ModuleOnlyParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

/** Disengage magnet of specified magnetic module. */
export const disengageMagnet: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId } = args
  const { moduleEntities } = invariantContext
  const commandType = 'magneticModule/disengage'

  if (moduleId === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  if (moduleEntities[moduleId]?.type !== MAGNETIC_MODULE_TYPE) {
    throw new Error(
      `expected module ${moduleId} to be magdeck, got ${moduleEntities[moduleId]?.type}`
    )
  }

  const pythonName = moduleEntities[moduleId].pythonName

  return {
    commands: [
      {
        commandType,
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.disengage()`,
  }
}
