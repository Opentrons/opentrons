// @flow
import last from 'lodash/last'
import { getNextRobotStateAndWarningsSingleCommand } from '../getNextRobotStateAndWarnings'
import { stripNoOpCommands } from './stripNoOpCommands'
import type {
  InvariantContext,
  RobotState,
  Timeline,
  CurriedCommandCreator,
  RobotStateAndWarnings,
} from '../types'

export const commandCreatorsTimeline = (
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

      const strippedCommands = stripNoOpCommands(commandCreatorResult.commands)
      const nextRobotStateAndWarnings = strippedCommands.reduce(
        (acc: RobotStateAndWarnings, command) =>
          getNextRobotStateAndWarningsSingleCommand(
            command,
            invariantContext,
            acc.robotState
          ),
        { robotState: prevRobotState, warnings: [] }
      )
      const nextResult = {
        commands: commandCreatorResult.commands,
        robotState: nextRobotStateAndWarnings.robotState,
        warnings: commandCreatorResult.warnings,
      }

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
