// @flow
import {assign} from './'
import type {PipetteData, RobotState, CommandReducer} from './'

export default function pickUpTip (pipetteId: string, robotState: RobotState): CommandReducer {
  const pipetteData: PipetteData = robotState.instruments[pipetteId]
  let nextCommands = []

  nextCommands.push({
    command: 'pick-up-tip',
    pipette: pipetteData.id,
    labware: 'someTipRackID!!',
    well: 'Z1'
  })

  const nextRobotState: RobotState = assign(robotState)
    // robotState.tipState.pipettes[pipetteId] -> true}
  return {
    nextCommands,
    nextRobotState
  }
}
