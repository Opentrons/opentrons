// @flow
import {assign, getNextTiprack, tiprackWellNamesByCol} from './'
import type {RobotState, CommandReducer} from './types'

export default function pickUpTip (pipetteId: string, robotState: RobotState): CommandReducer {
  /**
    Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
    Expects 96-well format tip naming system on the tiprack.
    If there's already a tip on the pipette, this will drop it first
    TODO IMMEDIATELY: should this fn be renamed replaceTip?
  */
  const pipetteData = robotState.instruments[pipetteId]
  let nextCommands = []

  // TODO IMMEDIATELY: more elegant way to avoid this mutation-driven state update?
  let nextRobotState: RobotState = assign(robotState)

  // get next full tiprack in slot order
  const nextTiprack = getNextTiprack(pipetteData.channels, robotState)

  if (!nextTiprack) {
    throw new Error('TODO IMMEDIATELY/SOON! Need to figure out how to handle running out of tips')
  }

  if (robotState.tipState.pipettes[pipetteId]) {
    // already have tip, should drop it
    // TODO IMMEDIATELY: factor this drop tip out,
    // dropTip(pipetteId, robotState): CommandReducer fn, with tests & update to robot state.
    // This should be a model of how to keep passing around the robot state.
    nextCommands.push({
      command: 'drop-tip',
      pipette: pipetteData.id,
      labware: 'trashId', // TODO Ian 2018-02-09 will we always have this trash in robotState? If so, put the ID in constants (or cooked into RobotState type itself).
      well: 'A1' // TODO: Is 'A1' of the trash always the right place to drop tips?
    })
  }

  nextCommands.push({
    command: 'pick-up-tip',
    pipette: pipetteData.id,
    labware: nextTiprack.tiprackId,
    well: nextTiprack.well
  })

  // pipette now has tip
  nextRobotState.tipState.pipettes[pipetteId] = true

  // remove tips from tiprack
  if (pipetteData.channels === 1 && nextTiprack.well) {
    nextRobotState.tipState.tipracks[nextTiprack.tiprackId][nextTiprack.well] = false
  }
  if (pipetteData.channels === 8) {
    const allWells = tiprackWellNamesByCol.find(col => col[0] === nextTiprack.well)
    if (!allWells) {
      throw new Error('Invalid well: ' + (nextTiprack.well || '???'))
    }
    allWells.forEach(function (well) {
      nextRobotState.tipState.tipracks[nextTiprack.tiprackId][well] = false
    })
  }

  return {
    nextCommands,
    nextRobotState
  }
}
