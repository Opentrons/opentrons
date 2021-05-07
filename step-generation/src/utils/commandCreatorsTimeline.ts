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
  commandCreators: CurriedCommandCreator[],
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): Timeline => {
  const timeline = commandCreators.reduce(
    (acc: Timeline, commandCreator: CurriedCommandCreator, index: number) => {
      const prevRobotState =
        acc.timeline.length === 0
          ? initialRobotState
          : // @ts-expect-error(SA, 2021-05-03): last might return undefined
            last(acc.timeline).robotState

      if (acc.errors != null) {
        // error short-circuit
        return acc
      }

      const commandCreatorResult = commandCreator(
        invariantContext,
        prevRobotState
      )
      // @ts-expect-error(SA, 2021-05-03): errors does not exist on CommandsAndWarnings, need to type narrow
      if (commandCreatorResult.errors) {
        return {
          timeline: acc.timeline,
          // @ts-expect-error(SA, 2021-05-03):'errors' does not exist on CommandCreatorResult
          errors: commandCreatorResult.errors,
        }
      }
      // @ts-expect-error(SA, 2021-05-03): commands does not exist on CommandCreatorErrorResponse, need to type narrow
      const strippedCommands = stripNoOpCommands(commandCreatorResult.commands)
      const nextRobotStateAndWarnings = strippedCommands.reduce(
        (acc: RobotStateAndWarnings, command) =>
          getNextRobotStateAndWarningsSingleCommand(
            command,
            invariantContext,
            acc.robotState
          ),
        {
          robotState: prevRobotState,
          warnings: [],
        }
      )
      const nextResult = {
        // @ts-expect-error(SA, 2021-05-03): commands does not exist on CommandCreatorErrorResponse, need to type narrow
        commands: commandCreatorResult.commands,
        robotState: nextRobotStateAndWarnings.robotState,
        warnings: commandCreatorResult.warnings,
      }
      return {
        timeline: [...acc.timeline, nextResult],
        errors: null,
      }
    },
    {
      timeline: [],
      errors: null,
    }
  )
  return {
    timeline: timeline.timeline,
    errors: timeline.errors,
  }
}
