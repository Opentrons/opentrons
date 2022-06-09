import { RunTimeCommand } from '@opentrons/shared-data'

import { makeInitialRobotState } from './misc'

import type { RobotState, Timeline } from '../types'
import { getNextRobotStateAndWarningsSingleCommand } from '../getNextRobotStateAndWarnings'

export function createTimelineFromRunCommands(
  commands: RunTimeCommand[]
): Timeline {
  const invariantContext = constructInvariantContextFromRunCommands(commands)

  const pipetteLocations = commands.reduce<RobotState['pipettes']>(
    (acc, command) => {
      if (command.commandType === 'loadPipette') {
        return {
          ...acc,
          [command.result.pipetteId]: {
            mount: command.params.mount,
          },
        }
      }
    },
    {}
  )

  const labwareLocations = commands.reduce<RobotState['labware']>(
    (acc, command) => {
      if (command.commandType === 'loadLabware') {
        return {
          ...acc,
          [command.result.labwareId]: {
            slot:
              'slotName' in command.params.location
                ? command.params.location.slotName
                : command.params.location.moduleId,
          },
        }
      }
    },
    {}
  )
  const initialRobotState = makeInitialRobotState({
    invariantContext,
    labwareLocations,
    moduleLocations,
    pipetteLocations,
  })
  return commands.map(command =>
    getNextRobotStateAndWarningsSingleCommand(
      command,
      invariantContext,
      initialRobotState
    )
  )
}
