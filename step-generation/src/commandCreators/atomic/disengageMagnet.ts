import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type { CommandCreator, DisengageMagnetStepGenArgs } from '../../types'

/** Disengage magnet of specified magnetic module. */
export const disengageMagnet: CommandCreator<DisengageMagnetStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleEntities, runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const commandType = 'magneticModule/disengage'

  if (args.moduleId != null && moduleId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({
          parameterName: args.moduleId,
        }),
      ],
    }
  }

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
