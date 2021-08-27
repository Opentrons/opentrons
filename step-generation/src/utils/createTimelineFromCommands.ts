import last from 'lodash/last'
import { getNextRobotStateAndWarningsSingleCommand } from '../getNextRobotStateAndWarnings'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  InvariantContext,
  RobotState,
  CommandsAndRobotState,
} from '../types'

export const createTimelineFromCommands = (
  commands: Command[],
  invariantContext: InvariantContext
): CommandsAndRobotState[] =>
  commands.reduce<CommandsAndRobotState[]>(
    (acc, command: Command) => {
      const updates = getNextRobotStateAndWarningsSingleCommand(
        command,
        invariantContext,
        last(acc).robotState
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
        robotState: {
          pipettes: {},
          labware: {},
          modules: {},
          tipState: { tipracks: {}, pipettes: {} },
          liquidState: { pipettes: {}, labware: {} },
        },
        commands: [],
      },
    ]
  )
