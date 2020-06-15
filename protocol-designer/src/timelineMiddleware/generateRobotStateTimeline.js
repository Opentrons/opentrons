// @flow
import takeWhile from 'lodash/takeWhile'
import { commandCreatorFromStepArgs } from '../file-data/selectors/commands'
import {
  commandCreatorsTimeline,
  curryCommandCreator,
  getPipetteIdFromCCArgs,
  reduceCommandCreators,
} from '../step-generation/utils'
import { dropTip } from '../step-generation/commandCreators/atomic/dropTip'
import type {
  CommandCreatorArgs,
  CurriedCommandCreator,
  RobotState,
  InvariantContext,
  Timeline,
} from '../step-generation'
import type { StepArgsAndErrors } from '../steplist/types'

// TODO IMMEDIATELY: re-copy-paste after import re-re-factor, try 'import * as StepGeneration'
export type GenerateRobotStateTimelineArgs = {|
  allStepArgsAndErrors: {
    [string]: StepArgsAndErrors,
    ...,
  },
  orderedStepIds: Array<string>,
  initialRobotState: RobotState,
  invariantContext: InvariantContext,
|}
export const generateRobotStateTimeline = (
  args: GenerateRobotStateTimelineArgs
): Timeline => {
  const {
    allStepArgsAndErrors,
    orderedStepIds,
    initialRobotState,
    invariantContext,
  } = args
  console.log('got args', args)
  const allStepArgs: Array<CommandCreatorArgs | null> = orderedStepIds.map(
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
  const continuousStepArgs: Array<CommandCreatorArgs> = takeWhile(
    allStepArgs,
    stepArgs => stepArgs
  )

  const curriedCommandCreators = continuousStepArgs.reduce(
    (
      acc: Array<CurriedCommandCreator>,
      args: CommandCreatorArgs,
      stepIndex
    ): Array<CurriedCommandCreator> => {
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
      const pipetteId = getPipetteIdFromCCArgs(args)
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
              reduceCommandCreators(
                [
                  curriedCommandCreator,
                  curryCommandCreator(dropTip, {
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

  const timeline = commandCreatorsTimeline(
    curriedCommandCreators,
    invariantContext,
    initialRobotState
  )

  return timeline
}
