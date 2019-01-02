// @flow
import assert from 'assert'
import type {
  RobotState,
  Command,
  RobotStateAndWarnings,
} from '../types'
import forAspirateDispense from './forAspirateDispense'

export default function getNextRobotStateAndWarnings (command: Command, prevRobotState: RobotState): RobotStateAndWarnings {
  assert(command, 'undefined command passed to getNextRobotStateAndWarning')
  switch (command.command) {
    case 'dispense':
    case 'aspirate':
      // TODO: BC 2018-11-29 handle dispense
      return forAspirateDispense(command.params, prevRobotState)
    case 'blowout':
    case 'drop-tip':
    case 'pick-up-tip':
      // TODO: BC 2018-11-29 handle PipetteLabwareArgs
      return {robotState: prevRobotState, warnings: []}
    case 'touch-tip':
      // TODO: BC 2018-11-29 handle touch-tip
      return {robotState: prevRobotState, warnings: []}
    case 'delay':
      // TODO: BC 2018-11-29 handle delay
      return {robotState: prevRobotState, warnings: []}
    case 'air-gap':
      // TODO: BC 2018-11-29 handle air-gap
      return {robotState: prevRobotState, warnings: []}
    default:
      assert(false, `unknown command: ${command.command} passed to getNextRobotStateAndWarning`)
      return {robotState: prevRobotState, warnings: []}
  }
}
