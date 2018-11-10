// @flow
import assert from 'assert'
import cloneDeep from 'lodash/cloneDeep'
import {getLabware} from '@opentrons/shared-data'
import {dropTip, getNextTiprack, tiprackWellNamesByCol} from './'
import {insufficientTips} from './errorCreators'
import type {RobotState, CommandCreator} from './types'

const replaceTip = (pipetteId: string): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
    Expects 96-well format tip naming system on the tiprack.
    If there's already a tip on the pipette, this will drop it before getting a new one
  */
  const pipetteData = prevRobotState.instruments[pipetteId]

  let robotState = cloneDeep(prevRobotState)

  // get next full tiprack in slot order
  const nextTiprack = getNextTiprack(pipetteData, robotState)

  if (!nextTiprack) {
    // no valid next tip / tiprack, bail out
    return {
      errors: [insufficientTips()],
    }
  }

  // drop tip if you have one
  const dropTipResult = dropTip(pipetteData.id)(robotState)
  if (dropTipResult.errors) {
    return dropTipResult
  }
  robotState = dropTipResult.robotState

  const commands = [
    ...dropTipResult.commands,
    // pick up tip command
    {
      command: 'pick-up-tip',
      params: {
        pipette: pipetteData.id,
        labware: nextTiprack.tiprackId,
        well: nextTiprack.well,
      },
    },
  ]

  // pipette now has tip
  // TODO IMMEDIATELY: make this into selector in shared-data / robotStateSelector
  const tiprackType = robotState.labware[nextTiprack.tiprackId].type
  const tiprackData = getLabware(tiprackType)
  assert(tiprackData, `could not get labware data for tiprack: id=${nextTiprack.tiprackId}, type=${tiprackType}. ${JSON.stringify(tiprackData)}`)
  const tipMaxVolume = (tiprackData && tiprackData.metadata.tipVolume) || 0 // TODO IMMEDIATELY better bug reporting than 'max vol is 0 I guess'
  assert(tipMaxVolume > 0, `expected tipMaxVolume > 0, got ${tipMaxVolume}. tiprack id: ${nextTiprack.tiprackId}`)
  robotState.tipState.pipettes[pipetteId] = {tipMaxVolume}

  // update tiprack-to-pipette assignment
  robotState.tiprackAssignment = {
    ...robotState.tiprackAssignment,
    [nextTiprack.tiprackId]: pipetteId,
  }

  // remove tips from tiprack
  if (pipetteData.channels === 1 && nextTiprack.well) {
    robotState.tipState.tipracks[nextTiprack.tiprackId][nextTiprack.well] = false
  }
  if (pipetteData.channels === 8) {
    const allWells = tiprackWellNamesByCol.find(col => col[0] === nextTiprack.well)
    if (!allWells) {
      // TODO Ian 2018-04-30 return {errors}, don't throw
      throw new Error('Invalid well: ' + nextTiprack.well) // TODO: test
    }
    allWells.forEach(function (well) {
      robotState.tipState.tipracks[nextTiprack.tiprackId][well] = false
    })
  }

  return {
    commands,
    robotState,
  }
}

export default replaceTip
