import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  AspirateInPlaceStepGenArgs,
  CommandCreator,
  CommandCreatorError,
} from '../../types'

export const aspirateInPlace: CommandCreator<AspirateInPlaceStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const volume = resolveNumericRuntimeValue(args.volume, runtimeParameters)
  const flowRate = resolveNumericRuntimeValue(args.flowRate, runtimeParameters)
  const correctionVolume =
    args.correctionVolume == null
      ? undefined
      : resolveNumericRuntimeValue(args.correctionVolume, runtimeParameters)
  const rawValues = [
    args.pipetteId,
    args.volume,
    args.flowRate,
    args.correctionVolume,
  ]
  const resolvedValues = [pipetteId, volume, flowRate, correctionVolume]
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
        actionName: 'aspirate',
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
    // Note that correction volume is not supported in our public atomic liquid handling APIs
  ]
  return {
    commands: [
      {
        commandType: 'aspirateInPlace' as const,
        key: uuid(),
        params: {
          pipetteId,
          volume,
          flowRate,
          ...(correctionVolume != null ? { correctionVolume } : {}),
        },
      },
    ],
    python: `${pipettePythonName}.aspirate(${pythonArgs.join(', ')})`,
  }
}
