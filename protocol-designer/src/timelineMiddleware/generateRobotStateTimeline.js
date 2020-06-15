// @flow
import takeWhile from 'lodash/takeWhile'
import { commandCreatorFromStepArgs } from '../file-data/selectors/commands'
import * as StepGeneration from '../step-generation'
import type { StepArgsAndErrors } from '../steplist/types'

export type GenerateRobotStateTimelineArgs = {|
  allStepArgsAndErrors: {
    [string]: StepArgsAndErrors,
    ...,
  },
  orderedStepIds: Array<string>,
  initialRobotState: StepGeneration.RobotState,
  invariantContext: StepGeneration.InvariantContext,
|}
export const generateRobotStateTimeline = (
  args: GenerateRobotStateTimelineArgs
): StepGeneration.Timeline => {
  const {
    allStepArgsAndErrors,
    orderedStepIds,
    initialRobotState,
    invariantContext,
  } = args
  console.log('got args', args)

  const allStepArgs: Array<StepGeneration.CommandCreatorArgs | null> = orderedStepIds.map(
    stepId => {
      return (
        (allStepArgsAndErrors[stepId] &&
          allStepArgsAndErrors[stepId].stepArgs) ||
        null
      )
    }
  )

  // TODO: Ian 2018-06-14 `takeWhile` isn't inferring the right type
  // $FlowFixMe
  const continuousStepArgs: Array<StepGeneration.CommandCreatorArgs> = takeWhile(
    allStepArgs,
    stepArgs => stepArgs
  )

  const curriedCommandCreators = continuousStepArgs.reduce(
    (
      acc: Array<StepGeneration.CurriedCommandCreator>,
      args: StepGeneration.CommandCreatorArgs,
      stepIndex
    ): Array<StepGeneration.CurriedCommandCreator> => {
      const curriedCommandCreator = commandCreatorFromStepArgs(args)

      if (curriedCommandCreator === null) {
        // unsupported command creator in args.commandCreatorFnName
        return acc
      }

      // Drop tips eagerly, per pipette
      //
      // - If we don't have a 'changeTip: never' step for this pipette in the future,
      // we know the current tip(s) aren't going to be reused, so we can drop them
      // immediately after the current step is done.
      const pipetteId = StepGeneration.getPipetteIdFromCCArgs(args)
      if (pipetteId) {
        const nextStepArgsForPipette = continuousStepArgs
          .slice(stepIndex + 1)
          .find(stepArgs => stepArgs.pipette && stepArgs.pipette === pipetteId)

        const willReuseTip =
          nextStepArgsForPipette?.changeTip &&
          nextStepArgsForPipette.changeTip === 'never'
        if (!willReuseTip) {
          return [
            ...acc,
            (_invariantContext, _prevRobotState) =>
              StepGeneration.reduceCommandCreators(
                [
                  curriedCommandCreator,
                  StepGeneration.curryCommandCreator(StepGeneration.dropTip, {
                    pipette: pipetteId,
                  }),
                ],
                _invariantContext,
                _prevRobotState
              ),
          ]
        }
      }
      return [...acc, curriedCommandCreator]
    },
    []
  )

  const timeline = StepGeneration.commandCreatorsTimeline(
    curriedCommandCreators,
    invariantContext,
    initialRobotState
  )

  return timeline
}
