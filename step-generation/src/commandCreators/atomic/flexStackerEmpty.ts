import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  pythonRuntimeString,
  resolveAllowedRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  ModuleStepGenArgs,
} from '../../types'

const EMPTY_STRATEGIES = ['manualWithPause', 'logical'] as const

export const flexStackerEmpty: CommandCreator<
  ModuleStepGenArgs & {
    strategy: string
    message?: string
    count?: number | string
  }
> = (args, invariantContext, prevRobotState) => {
  const { strategy, message, count } = args
  const { moduleEntities, runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedStrategy = resolveAllowedRuntimeValue(
    strategy,
    EMPTY_STRATEGIES,
    runtimeParameters
  )
  const resolvedMessage =
    message == null
      ? undefined
      : resolveStringRuntimeValue(message, runtimeParameters)
  const resolvedCount =
    count == null
      ? undefined
      : resolveNumericRuntimeValue(count, runtimeParameters)
  const rawValues = [args.moduleId, strategy, message, count]
  const resolvedValues = [
    moduleId,
    resolvedStrategy,
    resolvedMessage,
    resolvedCount,
  ]
  const errors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    moduleId == null ||
    resolvedStrategy == null ||
    resolvedMessage === null ||
    resolvedCount === null
  ) {
    return { errors }
  }

  const flexStackerState = flexStackerStateGetter(prevRobotState, moduleId)
  if (moduleEntities[moduleId] == null || flexStackerState == null) {
    return { errors: [errorCreators.missingModuleError()] }
  }
  const pythonName = moduleEntities[moduleId].pythonName
  const pythonMessage =
    message && resolvedMessage != null
      ? `message=${pythonRuntimeString(message, resolvedMessage, runtimeParameters)}`
      : ''

  return {
    commands: [
      {
        commandType: 'flexStacker/empty',
        key: uuid(),
        params: {
          moduleId,
          strategy: resolvedStrategy as (typeof EMPTY_STRATEGIES)[number],
          message: resolvedMessage,
          count: resolvedCount,
        },
      },
    ],
    python: `${pythonName}.empty(${pythonMessage})`,
  }
}
