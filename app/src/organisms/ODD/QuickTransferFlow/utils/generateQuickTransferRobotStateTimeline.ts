import {
  commandCreatorsTimeline,
  curryCommandCreator,
  dropTip,
  dropTipInTrash,
  dropTipInWasteChute,
  getPipetteIdFromCCArgs,
  reduceCommandCreators,
} from '@opentrons/step-generation'

import { createCommandCreatorFromStepArgs } from './createCommandCreatorFromStepArgs'

import type { CutoutId } from '@opentrons/shared-data'
import type * as StepGeneration from '@opentrons/step-generation'
import type { MoveLiquidStepArgs } from './generateQuickTransferArgs'

export interface GenerateQuickTransferRobotStateTimelineArgs {
  stepArgs: MoveLiquidStepArgs
  initialRobotState: StepGeneration.RobotState
  invariantContext: StepGeneration.InvariantContext
}
export const generateQuickTransferRobotStateTimeline = (
  args: GenerateQuickTransferRobotStateTimelineArgs
): StepGeneration.Timeline => {
  const { stepArgs, initialRobotState, invariantContext } = args

  if (stepArgs == null) {
    return { timeline: [] }
  }

  const curriedCommandCreator = createCommandCreatorFromStepArgs(stepArgs)

  if (curriedCommandCreator === null) {
    return { timeline: [] }
  }

  const pipetteId = getPipetteIdFromCCArgs(stepArgs)
  const dropTipLocation = stepArgs.dropTipLocation

  const curriedCommandCreators: StepGeneration.CurriedCommandCreator[] = []

  // Always add the transfer/consolidate/distribute commands first
  curriedCommandCreators.push(curriedCommandCreator)

  if (pipetteId != null) {
    const isWasteChute =
      invariantContext.wasteChuteEntities[dropTipLocation] != null
    const isTrashBin =
      invariantContext.trashBinEntities[dropTipLocation] != null

    let dropTipCommand: StepGeneration.CurriedCommandCreator

    if (isWasteChute) {
      dropTipCommand = curryCommandCreator(dropTipInWasteChute, {
        pipetteId,
        wasteChuteId: invariantContext.wasteChuteEntities[dropTipLocation].id,
      })
    } else if (isTrashBin) {
      const trashLocation =
        invariantContext.trashBinEntities[dropTipLocation].location
      dropTipCommand = curryCommandCreator(dropTipInTrash, {
        pipetteId,
        trashLocation: trashLocation as CutoutId,
      })
    } else {
      dropTipCommand = curryCommandCreator(dropTip, {
        pipette: pipetteId,
        dropTipLocation,
      })
    }

    // Wrap drop tip commands and rest of commands in a grouped reducer
    curriedCommandCreators[curriedCommandCreators.length - 1] = (
      _invariantContext,
      _prevRobotState
    ) =>
      reduceCommandCreators(
        [curriedCommandCreator, dropTipCommand],
        _invariantContext,
        _prevRobotState
      )
  }

  const timeline = commandCreatorsTimeline(
    curriedCommandCreators,
    invariantContext,
    initialRobotState
  )
  return timeline
}
