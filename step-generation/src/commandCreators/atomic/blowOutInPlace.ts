import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  BlowOutInPlaceStepGenArgs,
  CommandCreator,
  CommandCreatorError,
} from '../../types'

export const blowOutInPlace: CommandCreator<BlowOutInPlaceStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const flowRate = resolveNumericRuntimeValue(args.flowRate, runtimeParameters)
  const rawValues = [args.pipetteId, args.flowRate]
  const resolvedValues = [pipetteId, flowRate]
  const errors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (errors.length > 0 || pipetteId == null || flowRate == null) {
    return { errors }
  }

  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'blowout',
        pipette: pipetteId,
      })
    )
  }
  if (errors.length > 0) {
    return { errors }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  return {
    commands: [
      {
        commandType: 'blowOutInPlace' as const,
        key: uuid(),
        params: {
          pipetteId,
          flowRate,
        },
      },
    ],
    python:
      // blow_out() blows out in place if no location= is specified
      `${pipettePythonName}.flow_rate.blow_out = ${args.flowRate}\n` +
      `${pipettePythonName}.blow_out()`,
  }
}
