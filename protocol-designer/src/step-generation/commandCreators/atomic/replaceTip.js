// @flow
import cloneDeep from 'lodash/cloneDeep'
import { getNextTiprack } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import dropTip from './dropTip'
import { modulePipetteCollision } from '../../utils'
import type { CommandCreator, InvariantContext, RobotState } from '../../types'

const replaceTip = (pipetteId: string): CommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  /**
    Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
    Expects 96-well format tip naming system on the tiprack.
    If there's already a tip on the pipette, this will drop it before getting a new one
  */
  let robotState = cloneDeep(prevRobotState)

  const nextTiprack = getNextTiprack(pipetteId, invariantContext, robotState)

  if (!nextTiprack) {
    // no valid next tip / tiprack, bail out
    return {
      errors: [errorCreators.insufficientTips()],
    }
  }
  if (
    nextTiprack &&
    modulePipetteCollision({
      pipette: pipetteId,
      labware: nextTiprack.tiprackId,
      invariantContext,
      prevRobotState,
    })
  ) {
    return { errors: [errorCreators.modulePipetteCollisionDanger()] }
  }

  // drop tip if you have one
  const dropTipResult = dropTip(pipetteId)(invariantContext, robotState)
  if (dropTipResult.errors) {
    return dropTipResult
  }
  robotState = dropTipResult.robotState

  const commands = [
    ...dropTipResult.commands,
    // pick up tip command
    {
      command: 'pickUpTip',
      params: {
        pipette: pipetteId,
        labware: nextTiprack.tiprackId,
        well: nextTiprack.well,
      },
    },
  ]

  // pipette now has tip
  robotState.tipState.pipettes[pipetteId] = true

  // TODO: Ian 2019-04-18 make this robotState tipState mutation a result of
  // processing JSON commands, not done inside a command creator
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec
  if (!pipetteSpec)
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
          actionName: 'replaceTip',
          pipette: pipetteId,
        }),
      ],
    }

  const labwareDef =
    invariantContext.labwareEntities[nextTiprack.tiprackId]?.def
  if (!labwareDef) {
    return {
      errors: [
        errorCreators.labwareDoesNotExist({
          actionName: 'replaceTip',
          labware: nextTiprack.tiprackId,
        }),
      ],
    }
  }
  // remove tips from tiprack
  if (pipetteSpec.channels === 1 && nextTiprack.well) {
    robotState.tipState.tipracks[nextTiprack.tiprackId][
      nextTiprack.well
    ] = false
  }
  if (pipetteSpec.channels === 8) {
    const allWells = labwareDef.ordering.find(
      col => col[0] === nextTiprack.well
    )
    if (!allWells) {
      // TODO Ian 2018-04-30 return {errors}, don't throw
      throw new Error('Invalid well: ' + nextTiprack.well) // TODO: test
    }
    allWells.forEach(function(well) {
      robotState.tipState.tipracks[nextTiprack.tiprackId][well] = false
    })
  }

  return {
    commands,
    robotState,
  }
}

export default replaceTip
