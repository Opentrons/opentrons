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
import { AspirateInPlaceParams } from '@opentrons/shared-data'

export const aspirateInPlace: CommandCreator<AspirateInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate, correctionVolume } = args
  const { runtimeParameters } = invariantContext
  const errors: CommandCreatorError[] = []

  const resolvedPipetteId = resolveStringRuntimeValue(
    pipetteId,
    runtimeParameters
  )
  const resolvedVolume = resolveNumericRuntimeValue(volume, runtimeParameters)
  const resolvedFlowRate = resolveNumericRuntimeValue(
    flowRate,
    runtimeParameters
  )
  const resolvedCorrectionVolume =
    correctionVolume == null
      ? null
      : resolveNumericRuntimeValue(correctionVolume, runtimeParameters)

  if (resolvedPipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: pipetteId })
    )
  }
  if (typeof volume === 'string' && resolvedVolume == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: volume })
    )
  }
  if (typeof flowRate === 'string' && resolvedFlowRate == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: flowRate })
    )
  }
  if (
    typeof correctionVolume === 'string' &&
    resolvedCorrectionVolume == null
  ) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: correctionVolume,
      })
    )
  }

  if (
    resolvedPipetteId != null &&
    !prevRobotState.tipState.pipettes[resolvedPipetteId]?.hasTip
  ) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'aspirate',
        pipette: resolvedPipetteId,
      })
    )
  }

  if (
    errors.length > 0 ||
    resolvedPipetteId == null ||
    resolvedVolume == null ||
    resolvedFlowRate == null ||
    resolvedCorrectionVolume === null
  ) {
    return { errors }
  }

  const commands = [
    {
      commandType: 'aspirateInPlace' as const,
      key: uuid(),
      params: {
        pipetteId: resolvedPipetteId,
        volume: resolvedVolume,
        flowRate: resolvedFlowRate,
        ...(resolvedCorrectionVolume != null
          ? { correctionVolume: resolvedCorrectionVolume }
          : {}),
      },
    },
  ]

  const pipettePythonName =
    invariantContext.pipetteEntities[resolvedPipetteId].pythonName
  // Keep variable names in Python; command params use resolved defaults.
  const pythonArgs = [`volume=${volume}`, `flow_rate=${flowRate}`]
  const python = `${pipettePythonName}.aspirate(${pythonArgs.join(', ')})`

  return {
    commands,
    python,
  }
}
