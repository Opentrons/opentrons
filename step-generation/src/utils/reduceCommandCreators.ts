import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import type { Command } from '@opentrons/shared-data/lib/protocol/types/schemaV6'
import type {
  InvariantContext,
  RobotState,
  CommandCreatorError,
  CommandCreatorWarning,
  CommandCreatorResult,
  CurriedCommandCreator,
} from '../types'
type CCReducerAcc = {
  robotState: RobotState
  commands: Array<Command>
  errors: Array<CommandCreatorError>
  warnings: Array<CommandCreatorWarning>
}
export const reduceCommandCreators = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): CommandCreatorResult => {
  const result = commandCreators.reduce(
    (prev: CCReducerAcc, reducerFn: CurriedCommandCreator): CCReducerAcc => {
      if (prev.errors.length > 0) {
        // if there are errors, short-circuit the reduce
        return prev
      }

      const next = reducerFn(invariantContext, prev.robotState)
      // @ts-expect-error(SA, 2021-05-03): errors does not exist on CommandsAndWarnings, need to type narrow
      if (next.errors) {
        return {
          robotState: prev.robotState,
          commands: prev.commands,
          // @ts-expect-error(SA, 2021-05-03): errors does not exist on CommandsAndWarnings, need to type narrow
          errors: next.errors,
          warnings: prev.warnings,
        }
      }
      // @ts-expect-error(SA, 2021-05-03): commands does not exist on CommandCreatorErrorResponse, need to type narrow
      const allCommands = [...prev.commands, ...next.commands]
      const updates = getNextRobotStateAndWarnings(
        // @ts-expect-error(SA, 2021-05-03): commands does not exist on CommandCreatorErrorResponse, need to type narrow
        next.commands,
        invariantContext,
        prev.robotState
      )
      return {
        ...prev,
        robotState: updates.robotState,
        commands: allCommands,
        warnings: [
          ...(prev.warnings || []),
          ...(next.warnings || []),
          ...updates.warnings,
        ],
      }
    },
    {
      robotState: initialRobotState,
      commands: [],
      errors: [],
      warnings: [],
    }
  )

  if (result.errors.length > 0) {
    return {
      errors: result.errors,
    }
  }

  return {
    commands: result.commands,
    warnings: result.warnings,
  }
}
