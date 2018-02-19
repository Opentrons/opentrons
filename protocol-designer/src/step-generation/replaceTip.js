// @flow
import cloneDeep from 'lodash/cloneDeep'
import {dropTip, getNextTiprack, tiprackWellNamesByCol} from './'
import type {RobotState, CommandCreator} from './types'

const replaceTip = (pipetteId: string): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
    Expects 96-well format tip naming system on the tiprack.
    If there's already a tip on the pipette, this will drop it before getting a new one
  */
  const pipetteData = prevRobotState.instruments[pipetteId]

  // TODO IMMEDIATELY: more elegant way to avoid this mutation-driven state update?
  let robotState = cloneDeep(prevRobotState)

  // get next full tiprack in slot order
  const nextTiprack = getNextTiprack(pipetteData.channels, robotState)

  if (!nextTiprack) {
    throw new Error('TODO IMMEDIATELY/SOON! Need to figure out how to handle running out of tips') // TODO: test
  }

  // drop tip if you have one
  const dropTipResult = dropTip(pipetteData.id)(robotState)
  robotState = dropTipResult.robotState

  const commands = [
    ...dropTipResult.commands,
    // pick up tip command
    {
      command: 'pick-up-tip',
      pipette: pipetteData.id,
      labware: nextTiprack.tiprackId,
      well: nextTiprack.well
    }
  ]

  // pipette now has tip
  robotState.tipState.pipettes[pipetteId] = true

  // remove tips from tiprack
  if (pipetteData.channels === 1 && nextTiprack.well) {
    robotState.tipState.tipracks[nextTiprack.tiprackId][nextTiprack.well] = false
  }
  if (pipetteData.channels === 8) {
    const allWells = tiprackWellNamesByCol.find(col => col[0] === nextTiprack.well)
    if (!allWells) {
      throw new Error('Invalid well: ' + nextTiprack.well) // TODO: test
    }
    allWells.forEach(function (well) {
      robotState.tipState.tipracks[nextTiprack.tiprackId][well] = false
    })
  }

  return {
    commands,
    robotState
  }
}

export default replaceTip
