import last from 'lodash/last'
import { getNextRobotStateAndWarningsSingleCommand } from '../getNextRobotStateAndWarnings'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { InvariantContext, CommandsAndRobotState } from '../types'
import { makeInitialRobotState } from './misc'

export const createTimelineFromCommands = (
  commands: Command[],
  invariantContext: InvariantContext
): CommandsAndRobotState[] =>
  commands.reduce<CommandsAndRobotState[]>(
    (acc, command: Command) => {
      const prevRobotStateAndCommands = last(acc)
      if (prevRobotStateAndCommands == null) return acc // should never be reached
      const updates = getNextRobotStateAndWarningsSingleCommand(
        command,
        invariantContext,
        prevRobotStateAndCommands.robotState
      )
      return [
        ...acc,
        {
          robotState: updates.robotState,
          commands: [command],
        },
      ]
    },
    [
      {
        robotState: makeInitialRobotState({
          invariantContext,
          labwareLocations: {},
          moduleLocations: {},
          pipetteLocations: {},
        }),
        commands: [],
      },
    ]
  )
