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

export const airGapInPlace: CommandCreator<AspirateInPlaceStepGenArgs> = (
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

  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec
  if (!pipetteSpec) {
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
          pipette: pipetteId,
        }),
      ],
    }
  }
  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName

  const commands = [
    {
      commandType: 'airGapInPlace' as const,
      key: uuid(),
      params: {
        flowRate,
        pipetteId,
        volume,
        ...(correctionVolume != null ? { correctionVolume } : {}),
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.air_gap(${[
      `volume=${args.volume}`,
      `in_place=True`,
      `flow_rate=${args.flowRate}`,
      // Note that correction volume is not supported in our public atomic liquid handling APIs
    ].join(', ')})`,
  }
}
