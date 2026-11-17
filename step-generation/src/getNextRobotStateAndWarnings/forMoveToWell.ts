import { resolveStringRuntimeValue } from '../utils'

import type {
  InvariantContext,
  MoveToWellStepGenArgs,
  RobotStateAndWarnings,
} from '../types'

export function forMoveToWell(
  params: MoveToWellStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(
    params.pipetteId,
    runtimeParameters
  )
  const labwareId = resolveStringRuntimeValue(
    params.labwareId,
    runtimeParameters
  )
  const wellName = resolveStringRuntimeValue(params.wellName, runtimeParameters)
  if (pipetteId == null || labwareId == null || wellName == null) {
    console.error(
      `forMoveToWell: arg resolved to null (pipetteId=${String(
        pipetteId
      )}, labwareId=${String(labwareId)}, wellName=${String(wellName)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  robotState.pipettes[pipetteId] = {
    ...robotState.pipettes[pipetteId],
    entityId: labwareId,
    wellName: wellName,
  }
}
