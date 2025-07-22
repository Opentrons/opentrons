import {
  dropTipInTrash,
  dropTipInWasteChute,
  curryCommandCreator,
  dropTip,
  reduceCommandCreators,
  commandCreatorsTimeline,
  getPipetteIdFromCCArgs,
} from '@opentrons/step-generation'
import { createCommandCreatorFromStepArgs } from './createCommandCreatorFromStepArgs'
import type * as StepGeneration from '@opentrons/step-generation'
import type { CutoutId } from '@opentrons/shared-data'
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
    const dropTipEntity =
      invariantContext.additionalEquipmentEntities[dropTipLocation]
    const isWasteChute = dropTipEntity.name === 'wasteChute'
    const isTrashBin = dropTipEntity.name === 'trashBin'

    let dropTipCommand: StepGeneration.CurriedCommandCreator

    if (isWasteChute) {
      dropTipCommand = curryCommandCreator(dropTipInWasteChute, {
        pipetteId,
        wasteChuteId: dropTipEntity.id,
      })
    } else if (isTrashBin) {
      dropTipCommand = curryCommandCreator(dropTipInTrash, {
        pipetteId,
        trashLocation: dropTipEntity.location as CutoutId,
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
