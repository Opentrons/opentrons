import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  EngageMagnetStepGenArgs,
} from '../../types'

/** Engage magnet of specified magnetic module to given engage height. */
export const engageMagnet: CommandCreator<EngageMagnetStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleEntities, runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const height = resolveNumericRuntimeValue(args.height, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  if (typeof args.height === 'string' && height == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.height })
    )
  }
  if (errors.length > 0 || moduleId == null || height == null) {
    console.error(
      `engageMagnet: arg resolved to null (moduleId=${String(
        moduleId
      )}, height=${String(height)})`
    )
    return { errors }
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
        commandType: 'magneticModule/engage',
        key: uuid(),
        params: {
          moduleId,
          height,
        },
      },
    ],
    python: `${pythonName}.engage(height_from_base=${args.height})`,
  }
}
