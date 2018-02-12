// @flow
import cloneDeep from 'lodash/cloneDeep'
import {dropTip, getNextTiprack, tiprackWellNamesByCol} from './'
import type {RobotState, CommandReducer} from './types'

export default function replaceTip (pipetteId: string, robotState: RobotState): CommandReducer {
  /**
    Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
    Expects 96-well format tip naming system on the tiprack.
    If there's already a tip on the pipette, this will drop it first
    TODO IMMEDIATELY: should this fn be renamed replaceTip?
  */
  const pipetteData = robotState.instruments[pipetteId]
  let nextCommands = []

  // TODO IMMEDIATELY: more elegant way to avoid this mutation-driven state update?
  let nextRobotState = cloneDeep(robotState)

  // get next full tiprack in slot order
  const nextTiprack = getNextTiprack(pipetteData.channels, robotState)

  if (!nextTiprack) {
    throw new Error('TODO IMMEDIATELY/SOON! Need to figure out how to handle running out of tips')
  }

  // drop tip if you have one
  const dropTipResult = dropTip(pipetteData.id, nextRobotState)
  nextCommands = nextCommands.concat(dropTipResult.nextCommands)
  nextRobotState = dropTipResult.nextRobotState

  // pick up tip command
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
