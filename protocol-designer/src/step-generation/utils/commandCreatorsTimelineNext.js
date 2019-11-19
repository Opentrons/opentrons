// @flow
import last from 'lodash/last'
import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import type {
  InvariantContext,
  RobotState,
  Timeline,
  CurriedCommandCreator,
  RobotStateAndWarnings,
} from '../types'
export const commandCreatorsTimelineNext = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): Timeline => {
  const timeline = commandCreators.reduce(
    (acc: Timeline, commandCreator: CurriedCommandCreator, index: number) => {
      const prevRobotState =
        acc.timeline.length === 0
          ? initialRobotState
          : last(acc.timeline).robotState

      if (acc.errors) {
        // error short-circuit
        return acc
      }

      const commandCreatorResult = commandCreator(
        invariantContext,
        prevRobotState
      )

      if (commandCreatorResult.errors) {
        return {
          timeline: acc.timeline,
          errors: commandCreatorResult.errors,
        }
      }

      const commands = commandCreatorResult.commands
      const nextRobotStateAndWarnings = commands.reduce(
        (acc: RobotStateAndWarnings, command) =>
          getNextRobotStateAndWarnings(
            command,
            invariantContext,
            acc.robotState
          ),
        { robotState: prevRobotState, warnings: [] }
      )
      const nextResult = {
        commands: commandCreatorResult.commands,
        robotState: nextRobotStateAndWarnings.robotState,
      }

      // TODO IMMEDIATELY allow warnings in timeline frames
      return {
        timeline: [...acc.timeline, nextResult],
        errors: null,
      }
    },
    { timeline: [], errors: null }
  )

  return {
    timeline: timeline.timeline,
    errors: timeline.errors,
  }
}
