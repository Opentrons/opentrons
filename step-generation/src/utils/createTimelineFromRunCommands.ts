import {
  FLEX_STACKER_MODULE_TYPE,
  getModuleDef,
  locationIsOffDeck,
} from '@opentrons/shared-data'

import { MODULE_INITIAL_STATE_BY_TYPE } from '../constants'
import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import { getStackForLabwareLocation, makeInitialRobotState } from './misc'

import type {
  FlexStackerFillRunTimeCommand,
  FlexStackerSetStoredLabwareRunTimeCommand,
  LabwareLocationSequence,
  OnLabwareLocationSequenceComponent,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

const STACKER_SLOT_MAPPING: Record<string, string> = {
  A3: 'A4',
  B3: 'B4',
  C3: 'C4',
  D3: 'D4',
}

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
            slot:
              moduleType === FLEX_STACKER_MODULE_TYPE
                ? STACKER_SLOT_MAPPING[command.params.location.slotName]
                : command.params.location.slotName,
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
        const stackLabwareId = result.stackLabwareId
        const stackLocationSequence = result.stackLocationSequence

        const getLocationStack = (
          location: typeof command.params.location
        ): string[] => {
          if (locationIsOffDeck(location)) {
            return [location]
          } else if ('slotName' in location) {
            return [location.slotName]
          } else if ('moduleId' in location) {
            const moduleSlot =
              moduleLocations[location.moduleId]?.slot ?? 'offDeck'
            return [location.moduleId, moduleSlot]
          } else if ('addressableAreaName' in location) {
            return [location.addressableAreaName]
          }
          return ['offDeck']
        }

        if (locationSequences != null) {
          const sequenceMap = locationSequences.reduce(
            (acc: Record<string, LabwareLocationSequence>, subArray) => {
              const firstLabware:
                OnLabwareLocationSequenceComponent | undefined = subArray.find(
                (item): item is OnLabwareLocationSequenceComponent =>
                  item.kind === 'onLabware'
              )
              if (firstLabware != null) {
                acc[firstLabware.labwareId] = subArray
              }
              return acc
            },
            {}
          )
          const labwareStacks = labwareIds.reduce(
            (acc: Record<string, { stack: string[] }>, id, index) => {
              const sequence = sequenceMap[id] ?? locationSequences[index]
              if (sequence != null) {
                const stack = getStackForLabwareLocation(sequence)
                acc[id] = {
                  stack: stack[0] === id ? stack : [id, ...stack],
                }
              } else {
                const location = command.params.location
                if (locationIsOffDeck(location)) {
                  acc[id] = { stack: [id, location] }
                } else if ('slotName' in location) {
                  acc[id] = { stack: [id, location.slotName] }
                } else {
                  acc[id] = { stack: [id, 'offDeck'] }
                }
              }
              return acc
            },
            {}
          )
          const stackLabwareStack =
            stackLabwareId != null && stackLocationSequence != null
              ? [
                  stackLabwareId,
                  ...getStackForLabwareLocation(stackLocationSequence),
                ]
              : null
          return {
            ...acc,
            ...labwareStacks,
            ...(stackLabwareId != null && stackLabwareStack != null
              ? { [stackLabwareId]: { stack: stackLabwareStack } }
              : {}),
          }
        } else {
          const location = command.params.location
          const labwareStacks = labwareIds.reduce(
            (acc: Record<string, { stack: string[] }>, id) => {
              if (locationIsOffDeck(location)) {
                acc[id] = { stack: [id, location] }
              } else if ('slotName' in location) {
                acc[id] = { stack: [id, location.slotName] }
              } else if ('moduleId' in location) {
                const moduleId = location.moduleId
                acc[id] = {
                  stack: [id, moduleId, moduleLocations[moduleId].slot],
                }
              } else {
                acc[id] = { stack: [id, 'offDeck'] }
              }
              return acc
            },
            {}
          )
          const stackLabwareStack =
            stackLabwareId != null
              ? [stackLabwareId, ...getLocationStack(location)]
              : null
          return {
            ...acc,
            ...labwareStacks,
            ...(stackLabwareId != null && stackLabwareStack != null
              ? { [stackLabwareId]: { stack: stackLabwareStack } }
              : {}),
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
          const moduleId = command.params.location.moduleId
          if (moduleLocations[moduleId] == null) {
            console.warn(
              `Module ${moduleId} not found when processing loadLabware/loadLid command. `
            )
            return acc
          }
          stack.push(
            command.params.location.moduleId,
            moduleLocations[command.params.location.moduleId].slot
          )
        } else if ('labwareId' in command.params.location) {
          const labwareId = command.params.location.labwareId
          if (acc[labwareId] == null) {
            console.warn(
              `Parent labware ${labwareId} not found when processing loadLabware/loadLid command. `
            )
            acc[labwareId] = {
              stack: [labwareId, 'offDeck'],
            }
          }
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
      } else if (command.commandType === 'flexStacker/setStoredLabware') {
        const allStoredLabwareIds = getStoredLabwareIds(command)
        allStoredLabwareIds.forEach(storedLabwareId => {
          getIncrementStoredLabwareCounter(
            acc,
            storedLabwareId,
            'setStoredLabwareCount'
          )
        })
        return acc
      } else if (command.commandType === 'flexStacker/fill') {
        const allStoredLabwareIds = getStoredLabwareIds(command)
        allStoredLabwareIds.forEach(storedLabwareId => {
          getIncrementStoredLabwareCounter(acc, storedLabwareId, 'fillCount')
        })
        return acc
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

const getIncrementStoredLabwareCounter = (
  acc: RobotState['labware'],
  storedLabwareId: string,
  counter: 'setStoredLabwareCount' | 'fillCount'
): void => {
  const prev = acc[storedLabwareId] ?? {
    stack: [storedLabwareId, 'offDeck'],
  }

  acc[storedLabwareId] = {
    ...prev,
    [counter]: (prev[counter] ?? 0) + 1,
  }
}

const getStoredLabwareIds = (
  command:
    FlexStackerSetStoredLabwareRunTimeCommand | FlexStackerFillRunTimeCommand
): string[] => {
  const allStoredLabwareIds: string[] =
    command.result?.storedLabware?.flatMap(stored =>
      [
        stored.primaryLabwareId,
        stored.adapterLabwareId,
        stored.lidLabwareId,
      ].filter((id): id is string => id != null)
    ) ?? []
  return allStoredLabwareIds
}
