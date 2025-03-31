import { getModuleDef2 } from '@opentrons/shared-data'

import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import { MODULE_INITIAL_STATE_BY_TYPE } from '../constants'
import { makeInitialRobotState } from './misc'
import { commandCreatorFromStepArgs } from './commandCreatorFromRunTimeCommand'

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
  initialRobotState: RobotState
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

  const labwareLocations = commands.reduce<RobotState['labware']>(
    (acc, command) => {
      if (command.commandType === 'loadLabware' && command.result != null) {
        let slot
        if (
          command.params.location === 'offDeck' ||
          command.params.location === 'systemLocation'
        ) {
          slot = command.params.location
        } else if ('slotName' in command.params.location) {
          slot = command.params.location.slotName
        } else if ('moduleId' in command.params.location) {
          slot = command.params.location.moduleId
        } else if ('labwareId' in command.params.location) {
          slot = command.params.location.labwareId
        } else {
          slot = command.params.location.addressableAreaName
        }
        return {
          ...acc,
          [command.result.labwareId]: {
            slot: slot,
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
    initialRobotState,
  }
}

const getPython = (
  command: RunTimeCommand,
  invariantContext: InvariantContext,
  prevRobotState: RobotState,
  prevCommand: RunTimeCommand | null
): string => {
  const curriedCommandCreator = commandCreatorFromStepArgs(
    command,
    invariantContext,
    prevCommand
  )

  if (curriedCommandCreator == null) {
    return ''
  }
  console.log('prevRobotState', prevRobotState)
  const test = curriedCommandCreator(invariantContext, prevRobotState)
  console.log('test', test)
  return 'errors' in test
    ? `Error: ${test.errors[0].message}`
    : //  @ts-expect-error
      test?.python
}

export function getPythonFromSelectedCommands(
  allCommands: RunTimeCommand[],
  invariantContext: InvariantContext,
  initialRobotState: RobotState,
  commandId: string,
  selectedCommands: RunTimeCommand[]
): string {
  const robotStateAndWarnings = getNextRobotStateAndWarnings(
    allCommands,
    invariantContext,
    initialRobotState
  )
  console.log(allCommands)
  const specificCommand = selectedCommands.find(
    command => command.id === commandId
  )
  const index = selectedCommands.findIndex(command => command.id === commandId)

  const previousCommand = index > 0 ? selectedCommands[index - 1] : null

  return specificCommand != null
    ? getPython(
        specificCommand,
        invariantContext,
        robotStateAndWarnings.robotState,
        previousCommand
      )
    : ''
}
