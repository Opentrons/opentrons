// @flow
import cloneDeep from 'lodash/cloneDeep'
import { getNextRobotStateAndWarningsMulti } from '../getNextRobotStateAndWarnings'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  InvariantContext,
  RobotState,
  CommandCreatorError,
  CommandCreatorWarning,
  NextCommandCreatorResult,
  CurriedCommandCreator,
} from '../types'

type CCReducerAcc = {|
  robotState: RobotState,
  commands: Array<Command>,
  errors: Array<CommandCreatorError>,
  errorStep: ?number, // TODO IMMEDIATELY is this used anywhere??
  warnings: Array<CommandCreatorWarning>,
|}

// TODO IMMEDIATELY: test this!!!
export const reduceCommandCreatorsNext = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): NextCommandCreatorResult => {
  const result = commandCreators.reduce(
    (
      prev: CCReducerAcc,
      reducerFn: CurriedCommandCreator,
      stepIdx
    ): CCReducerAcc => {
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
          errorStep: stepIdx,
          warnings: prev.warnings,
        }
      }

      const allCommands = [...prev.commands, ...next.commands]
      const updates = getNextRobotStateAndWarningsMulti(
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
      robotState: cloneDeep(initialRobotState),
      commands: [],
      errors: [],
      errorStep: null,
      warnings: [],
    }
  )
  if (result.errors.length > 0) {
    return { errors: result.errors }
  }
  return { commands: result.commands, warnings: result.warnings }
}
