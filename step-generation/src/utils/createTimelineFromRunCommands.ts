import { getModuleDef, locationIsOffDeck } from '@opentrons/shared-data'

import { MODULE_INITIAL_STATE_BY_TYPE } from '../constants'
import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import { getStackForLabwareLocation, makeInitialRobotState } from './misc'

import type {
  LabwareLocationSequence,
  RunTimeCommand,
} from '@opentrons/shared-data'
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
        const moduleType = getModuleDef(command.params.model).moduleType
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
      if (command.commandType === 'loadLidStack' && command.result != null) {
        const { result } = command
        const locationSequences = result.locationSequences
        const labwareIds = result.labwareIds

        if (locationSequences != null) {
          const sequenceMap = locationSequences.reduce(
            (acc: Record<string, LabwareLocationSequence>, subArray) => {
              const firstLabware = subArray.find(
                item => item.kind === 'onLabware'
              )
              if (firstLabware?.labwareId) {
                acc[firstLabware.labwareId] = subArray
              }
              return acc
            },
            {}
          )
          const labwareStacks = labwareIds.reduce(
            (acc: Record<string, { stack: string[] }>, id) => {
              const sequence = sequenceMap[id]
              if (sequence != null) {
                acc[id] = { stack: getStackForLabwareLocation(sequence) }
              }
              return acc
            },
            {}
          )
          return {
            ...acc,
            ...labwareStacks,
          }
        }
      } else if (
        (command.commandType === 'loadLabware' ||
          command.commandType === 'loadLid') &&
        command.result != null
      ) {
        const stack = [command.result.labwareId]
        if (locationIsOffDeck(command.params.location)) {
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
