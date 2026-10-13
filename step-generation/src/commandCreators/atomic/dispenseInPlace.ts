import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  DispenseInPlaceStepGenArgs,
} from '../../types'

export const dispenseInPlace: CommandCreator<DispenseInPlaceStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { isAirGap } = args
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const volume = resolveNumericRuntimeValue(args.volume, runtimeParameters)
  const flowRate = resolveNumericRuntimeValue(args.flowRate, runtimeParameters)
  const pushOut =
    args.pushOut == null
      ? undefined
      : resolveNumericRuntimeValue(args.pushOut, runtimeParameters)
  const correctionVolume =
    args.correctionVolume == null
      ? undefined
      : resolveNumericRuntimeValue(args.correctionVolume, runtimeParameters)
  const rawValues = [
    args.pipetteId,
    args.volume,
    args.flowRate,
    args.pushOut,
    args.correctionVolume,
  ]
  const resolvedValues = [
    pipetteId,
    volume,
    flowRate,
    pushOut,
    correctionVolume,
  ]
  const errors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    pipetteId == null ||
    volume == null ||
    flowRate == null
  ) {
    return { errors }
  }

  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'dispense',
        pipette: pipetteId,
      })
    )
  }
  if (errors.length > 0) {
    return { errors }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const pythonArgs = [
    `volume=${args.volume}`,
    `flow_rate=${args.flowRate}`,
    ...(args.pushOut != null ? [`push_out=${args.pushOut}`] : []),
    // Note that correction volume is not supported in our public atomic liquid handling APIs
  ]
  return {
    commands: [
      {
        commandType: 'dispenseInPlace' as const,
        key: uuid(),
        params: {
          pipetteId,
          volume,
          flowRate,
          ...(pushOut != null ? { pushOut } : {}),
          ...(correctionVolume != null ? { correctionVolume } : {}),
        },
        ...(isAirGap ? { meta: { isAirGap } } : {}),
      },
    ],
    python: `${pipettePythonName}.dispense(${pythonArgs.join(', ')})`,
  }
}
