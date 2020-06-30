// @flow
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import type {
  InvariantContext,
  RobotState,
  CommandCreatorError,
  CommandCreatorWarning,
  CommandCreatorResult,
  CurriedCommandCreator,
} from '../types'

type CCReducerAcc = {|
  robotState: RobotState,
  commands: Array<Command>,
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
|}

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
      if (next.errors) {
        return {
          robotState: prev.robotState,
          commands: prev.commands,
          errors: next.errors,
          warnings: prev.warnings,
        }
      }

      const allCommands = [...prev.commands, ...next.commands]
      const updates = getNextRobotStateAndWarnings(
        allCommands,
        invariantContext,
        initialRobotState
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
    return { errors: result.errors }
  }
  return { commands: result.commands, warnings: result.warnings }
}
