import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  HeaterShakerSetTargetShakeSpeedStepGenArgs,
} from '../../types'

export const heaterShakerSetTargetShakeSpeed: CommandCreator<
  HeaterShakerSetTargetShakeSpeedStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { moduleEntities, runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const rpm = resolveNumericRuntimeValue(args.rpm, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  if (typeof args.rpm === 'string' && rpm == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.rpm })
    )
  }
  if (errors.length > 0 || moduleId == null || rpm == null) {
    return { errors }
  }

  if (moduleEntities[moduleId]?.type !== HEATERSHAKER_MODULE_TYPE) {
    throw new Error(
      `expected module ${moduleId} to be heaterShaker, got ${moduleEntities[moduleId]?.type}`
    )
  }
  const pythonName = moduleEntities[moduleId].pythonName

  return {
    commands: [
      {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        key: uuid(),
        params: {
          moduleId,
          rpm,
        },
      },
    ],
    python: `${pythonName}.set_and_wait_for_shake_speed(${args.rpm})`,
  }
}
