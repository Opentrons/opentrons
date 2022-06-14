import { RunTimeCommand } from '@opentrons/shared-data'

import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import { MODULE_INITIAL_STATE_BY_TYPE } from '../constants'
import { constructInvariantContextFromRunCommands } from './constructInvariantContextFromRunCommands'
import { makeInitialRobotState } from './misc'

import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

type RunCommandTimelineFrame = RobotStateAndWarnings & {
  command: RunTimeCommand
}
interface RunCommandTimeline {
  timeline: RunCommandTimelineFrame[]
  invariantContext: InvariantContext
}

export function createTimelineFromRunCommands(
  commands: RunTimeCommand[]
): RunCommandTimeline {
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
      return acc
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
      return acc
    },
    {}
  )

  const moduleLocations = commands.reduce<RobotState['modules']>(
    (acc, command) => {
      if (command.commandType === 'loadModule') {
        return {
          ...acc,
          [command.result.moduleId]: {
            slot: command.params.location.slotName,
            moduleState:
              MODULE_INITIAL_STATE_BY_TYPE[
                command.result.definition.moduleType
              ],
          },
        }
      }
      return acc
    },
    {}
  )
  const initialRobotState = makeInitialRobotState({
    invariantContext,
    labwareLocations,
    moduleLocations,
    pipetteLocations,
  })
  return {
    timeline: commands.map((command, index) => ({
      ...getNextRobotStateAndWarnings(
        commands.slice(0, index + 1),
        invariantContext,
        initialRobotState
      ),
      command,
    })),
    invariantContext,
  }
}
