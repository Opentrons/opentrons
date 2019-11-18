// @flow
import cloneDeep from 'lodash/cloneDeep'
import { getNextTiprack } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import dropTip from './dropTip'
import {
  curryCommandCreator,
  reduceCommandCreatorsNext,
  modulePipetteCollision,
} from '../../utils'
import type { CurriedCommandCreator, NextCommandCreator } from '../../types'

type PickUpTipArgs = {| pipette: string, tiprack: string, well: string |}
const _pickUpTip: NextCommandCreator<PickUpTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'pickUpTip',
        params: {
          pipette: args.pipette,
          labware: args.tiprack,
          well: args.well,
        },
      },
    ],
  }
}

type ReplaceTipArgs = {| pipette: string |}
/**
  Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
  Expects 96-well format tip naming system on the tiprack.
  If there's already a tip on the pipette, this will drop it before getting a new one
*/
const replaceTip: NextCommandCreator<ReplaceTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette } = args
  let robotState = cloneDeep(prevRobotState)

  const nextTiprack = getNextTiprack(pipette, invariantContext, robotState)

  if (!nextTiprack) {
    // no valid next tip / tiprack, bail out
    return {
      errors: [errorCreators.insufficientTips()],
    }
  } else if (
    modulePipetteCollision({
      pipette,
      labware: nextTiprack.tiprackId,
      invariantContext,
      prevRobotState,
    })
  ) {
    return { errors: [errorCreators.modulePipetteCollisionDanger()] }
  }

  const commandCreators: Array<CurriedCommandCreator> = [
    ...curryCommandCreator(dropTip, { pipette }),
    ...curryCommandCreator(_pickUpTip, {
      pipette,
      tiprack: nextTiprack.tiprackId,
      well: nextTiprack.well,
    }),
  ]

  // TODO IMMEDIATELY: handle robot state updates via getNextRobotState

  // robotState = dropTipResult.robotState

  // pipette now has tip
  // robotState.tipState.pipettes[pipette] = true

  // TODO: Ian 2019-04-18 make this robotState tipState mutation a result of
  // processing JSON commands, not done inside a command creator
  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec
  if (!pipetteSpec)
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
          actionName: 'replaceTip',
          pipette,
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

  return reduceCommandCreatorsNext(
    commandCreators,
    invariantContext,
    robotState
  )
}

export default replaceTip
