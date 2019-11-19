// @flow
import assert from 'assert'
import forAspirateDispense from './forAspirateDispense'
import { forBlowout } from './forBlowout'
import { forDropTip } from './forDropTip'
import { forPickUpTip } from './forPickUpTip'
import { forEngageMagnet, forDisengageMagnet } from './magnetUpdates'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export function getNextRobotStateAndWarnings(
  command: Command,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  assert(command, 'undefined command passed to getNextRobotStateAndWarning')
  switch (command.command) {
    case 'aspirate':
    case 'dispense':
      // TODO: BC 2018-11-29 handle dispense -- TODO IMMEDIATELY check this
      return forAspirateDispense(
        command.params,
        invariantContext,
        prevRobotState
      )
    case 'blowout':
      return forBlowout(command.params, invariantContext, prevRobotState)
    case 'dropTip':
      return forDropTip(command.params, invariantContext, prevRobotState)
    case 'pickUpTip':
      return forPickUpTip(command.params, invariantContext, prevRobotState)
    case 'airGap':
      // TODO: IL 2019-11-19 implement air gap (eventually)
      return { robotState: prevRobotState, warnings: [] }
    case 'magneticModule/engageMagnet':
      return forEngageMagnet(command.params, invariantContext, prevRobotState)
    case 'magneticModule/disengageMagnet':
      return forDisengageMagnet(
        command.params,
        invariantContext,
        prevRobotState
      )
    case 'touchTip':
    case 'delay':
      // these commands don't have any effects on the state
      return { robotState: prevRobotState, warnings: [] }
    default:
      assert(
        false,
        `unknown command: ${command.command} passed to getNextRobotStateAndWarning`
      )
      return { robotState: prevRobotState, warnings: [] }
  }
}

export function getNextRobotStateAndWarningsMulti(
  commands: Array<Command>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): RobotStateAndWarnings {
  return commands.reduce(
    (acc, command) => {
      const next = getNextRobotStateAndWarnings(
        command,
        invariantContext,
        acc.robotState
      )
      return {
        robotState: next.robotState,
        warnings: [...acc.warnings, ...next.warnings],
      }
    },
    { robotState: initialRobotState, warnings: [] }
  )
}
