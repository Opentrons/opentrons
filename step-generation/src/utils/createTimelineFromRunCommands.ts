import { getModuleDef2 } from '@opentrons/shared-data'

import { MODULE_INITIAL_STATE_BY_TYPE } from '../constants'
import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import { makeInitialRobotState } from './misc'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export type RunCommandTimelineFrame = RobotStateAndWarnings & {
  command: RunTimeCommand
}

interface ResultingTimelineFrame {
  frame: RunCommandTimelineFrame
  invariantContext: InvariantContext
}
export function getResultingTimelineFrameFromRunCommands(
  commands: RunTimeCommand[],
  invariantContext: InvariantContext
): ResultingTimelineFrame {
  const pipetteLocations = commands.reduce<RobotState['pipettes']>(
    (acc, command) => {
      if (command.commandType === 'loadPipette' && command.result != null) {
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
  const moduleLocations = commands.reduce<RobotState['modules']>(
    (acc, command) => {
      if (command.commandType === 'loadModule' && command.result != null) {
        const moduleType = getModuleDef2(command.params.model).moduleType
        return {
          ...acc,
          [command.result.moduleId]: {
            slot: command.params.location.slotName,
            moduleState: MODULE_INITIAL_STATE_BY_TYPE[moduleType],
          },
        }
      }
      return acc
    },
    {}
  )

  const labwareLocations = commands.reduce<RobotState['labware']>(
    (acc, command) => {
      if (command.commandType === 'loadLabware' && command.result != null) {
        const stack = [command.result.labwareId]
        if (
          command.params.location === 'offDeck' ||
          command.params.location === 'systemLocation'
        ) {
          stack.push(command.params.location)
        } else if ('slotName' in command.params.location) {
          stack.push(command.params.location.slotName)
        } else if ('moduleId' in command.params.location) {
          stack.push(
            command.params.location.moduleId,
            moduleLocations[command.params.location.moduleId].slot
          )
        } else if ('labwareId' in command.params.location) {
          const labwareId = command.params.location.labwareId
          const labwareIdStack = acc[labwareId].stack
          stack.push(labwareId, ...labwareIdStack)
        } else {
          stack.push(command.params.location.addressableAreaName)
        }
        return {
          ...acc,
          [command.result.labwareId]: {
            stack,
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
    frame: {
      ...getNextRobotStateAndWarnings(
        commands,
        invariantContext,
        initialRobotState
      ),
      command: commands[commands.length - 1],
    },
    invariantContext,
  }
}
