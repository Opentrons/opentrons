// @flow
import assert from 'assert'
import forAspirateDispense from './forAspirateDispense'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export default function getNextRobotStateAndWarnings(
  command: Command,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  assert(command, 'undefined command passed to getNextRobotStateAndWarning')
  switch (command.command) {
    case 'dispense':
    case 'aspirate':
      // TODO: BC 2018-11-29 handle dispense
      return forAspirateDispense(
        command.params,
        invariantContext,
        prevRobotState
      )
    case 'blowout':
    case 'dropTip':
    case 'pickUpTip':
      // TODO: BC 2018-11-29 handle PipetteLabwareArgs
      return { robotState: prevRobotState, warnings: [] }
    case 'touchTip':
      // TODO: BC 2018-11-29 handle touchTip
      return { robotState: prevRobotState, warnings: [] }
    case 'delay':
      // TODO: BC 2018-11-29 handle delay
      return { robotState: prevRobotState, warnings: [] }
    case 'airGap':
      // TODO: BC 2018-11-29 handle air-gap
      return { robotState: prevRobotState, warnings: [] }
    default:
      assert(
        false,
        `unknown command: ${
          command.command
        } passed to getNextRobotStateAndWarning`
      )
      return { robotState: prevRobotState, warnings: [] }
  }
}
