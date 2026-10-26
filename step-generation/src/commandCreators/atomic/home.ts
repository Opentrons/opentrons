import * as errorCreators from '../../errorCreators'
import {
  PROTOCOL_CONTEXT_NAME,
  pythonRuntimeString,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  GantryMount,
  HomeCreateCommand,
  MotorAxes,
} from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const home: CommandCreator<{
  axes?: string[]
  skipIfMountPositionOk?: string
}> = (args, invariantContext, prevRobotState) => {
  const { axes, skipIfMountPositionOk } = args
  const runtimeParameters = invariantContext.runtimeParameters ?? {}
  const resolvedAxes =
    axes == null
      ? undefined
      : axes.map(axis => resolveStringRuntimeValue(axis, runtimeParameters))
  const resolvedSkip =
    skipIfMountPositionOk == null
      ? undefined
      : resolveStringRuntimeValue(skipIfMountPositionOk, runtimeParameters)
  const errors: CommandCreatorError[] = []
  axes?.forEach((axis, i) => {
    if (resolvedAxes?.[i] == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({ parameterName: axis })
      )
    }
  })
  if (skipIfMountPositionOk != null && resolvedSkip == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: skipIfMountPositionOk,
      })
    )
  }
  if (errors.length > 0) {
    return { errors }
  }

  const command: HomeCreateCommand = {
    commandType: 'home',
    key: uuid(),
    params: {
      axes: resolvedAxes?.filter((axis): axis is string => axis != null) as
        MotorAxes | undefined,
      skipIfMountPositionOk: resolvedSkip as GantryMount | undefined,
    },
  }
  const pythonAxes =
    axes == null
      ? undefined
      : `[${axes
          .map((axis, i) =>
            pythonRuntimeString(
              axis,
              resolvedAxes?.[i] ?? axis,
              runtimeParameters
            )
          )
          .join(', ')}]`
  const pythonArgs = [
    ...(pythonAxes != null ? [`axes=${pythonAxes},\n`] : []),
    ...(skipIfMountPositionOk != null && resolvedSkip != null
      ? [
          `skipIfMountPositionOk=${pythonRuntimeString(skipIfMountPositionOk, resolvedSkip, runtimeParameters)},\n`,
        ]
      : []),
  ]

  const python = `${PROTOCOL_CONTEXT_NAME}.home(${pythonArgs.join(', ')})`
  return {
    commands: [command],
    python: python,
  }
}
