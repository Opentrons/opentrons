// @flow
import {assign, getNextTiprack} from './'
import type {PipetteData, RobotState, CommandReducer} from './'

export default function pickUpTip (pipetteId: string, robotState: RobotState): CommandReducer {
  const pipetteData: PipetteData = robotState.instruments[pipetteId]
  let nextCommands = []

  // get next full tiprack in slot order
  const nextTiprack = getNextTiprack(pipetteData.channels, robotState)

  if (nextTiprack === null) {
    throw new Error('TODO IMMEDIATELY! Need to handle running out of tips')
  }

  nextCommands.push({
    command: 'pick-up-tip',
    pipette: pipetteData.id,
    labware: nextTiprack.tiprackId,
    well: nextTiprack.well
  })

  const nextRobotState: RobotState = assign(robotState)
    // robotState.tipState.pipettes[pipetteId] -> true}
  return {
    nextCommands,
    nextRobotState
  }
}
