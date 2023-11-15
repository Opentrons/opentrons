import { getNextTiprack } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import { COLUMN_4_SLOTS } from '../../constants'
import { dropTip } from './dropTip'
import {
  curryCommandCreator,
  getLabwareSlot,
  reduceCommandCreators,
  modulePipetteCollision,
  uuid,
  pipetteAdjacentHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestWithLatchOpen,
  getIsHeaterShakerEastWestMultiChannelPipette,
  wasteChuteCommandsUtil,
} from '../../utils'
import type {
  CommandCreatorError,
  CurriedCommandCreator,
  CommandCreator,
} from '../../types'
interface PickUpTipArgs {
  pipette: string
  tiprack: string
  well: string
}

const _pickUpTip: CommandCreator<PickUpTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const errors: CommandCreatorError[] = []
  const tiprackSlot = prevRobotState.labware[args.tiprack].slot
  const pipetteName = invariantContext.pipetteEntities[args.pipette].name
  const adapterId =
    invariantContext.labwareEntities[tiprackSlot] != null
      ? invariantContext.labwareEntities[tiprackSlot]
      : null
  if (adapterId == null && pipetteName === 'p1000_96') {
    errors.push(errorCreators.missingAdapter())
  }
  if (COLUMN_4_SLOTS.includes(tiprackSlot)) {
    errors.push(
      errorCreators.pipettingIntoColumn4({ typeOfStep: 'pick up tip' })
    )
  }

  if (errors.length > 0) {
    return { errors }
  }
  return {
    commands: [
      {
        commandType: 'pickUpTip',
        key: uuid(),
        params: {
          pipetteId: args.pipette,
          labwareId: args.tiprack,
          wellName: args.well,
        },
      },
    ],
  }
}

interface ReplaceTipArgs {
  pipette: string
  dropTipLocation: string
}

/**
  Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
  Expects 96-well format tip naming system on the tiprack.
  If there's already a tip on the pipette, this will drop it before getting a new one
*/
export const replaceTip: CommandCreator<ReplaceTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, dropTipLocation } = args
  const nextTiprack = getNextTiprack(pipette, invariantContext, prevRobotState)

  if (nextTiprack == null) {
    // no valid next tip / tiprack, bail out
    return {
      errors: [errorCreators.insufficientTips()],
    }
  }

  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec
  const isFlexPipette =
    (pipetteSpec?.displayCategory === 'FLEX' || pipetteSpec?.channels === 96) ??
    false

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

  const isWasteChute =
    invariantContext.additionalEquipmentEntities[dropTipLocation] != null

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
  if (
    !invariantContext.labwareEntities[args.dropTipLocation] &&
    !invariantContext.additionalEquipmentEntities[args.dropTipLocation]
  ) {
    return { errors: [errorCreators.dropTipLocationDoesNotExist()] }
  }
  if (
    modulePipetteCollision({
      pipette,
      labware: nextTiprack.tiprackId,
      invariantContext,
      prevRobotState,
    })
  ) {
    return {
      errors: [errorCreators.modulePipetteCollisionDanger()],
    }
  }

  const slotName = getLabwareSlot(
    nextTiprack.tiprackId,
    prevRobotState.labware,
    prevRobotState.modules
  )

  if (!isFlexPipette) {
    if (
      pipetteAdjacentHeaterShakerWhileShaking(prevRobotState.modules, slotName)
    ) {
      return { errors: [errorCreators.heaterShakerNorthSouthEastWestShaking()] }
    }
    if (
      getIsHeaterShakerEastWestWithLatchOpen(prevRobotState.modules, slotName)
    ) {
      return { errors: [errorCreators.heaterShakerEastWestWithLatchOpen()] }
    }

    if (
      getIsHeaterShakerEastWestMultiChannelPipette(
        prevRobotState.modules,
        slotName,
        pipetteSpec
      )
    ) {
      return {
        errors: [errorCreators.heaterShakerEastWestOfMultiChannelPipette()],
      }
    }
  }

  const addressableAreaName =
    pipetteSpec.channels === 96
      ? '96ChannelWasteChute'
      : '1and8ChannelWasteChute'

  const commandCreators: CurriedCommandCreator[] = isWasteChute
    ? [
        curryCommandCreator(wasteChuteCommandsUtil, {
          type: 'dropTip',
          pipetteId: pipette,
          addressableAreaName,
        }),
        curryCommandCreator(_pickUpTip, {
          pipette,
          tiprack: nextTiprack.tiprackId,
          well: nextTiprack.well,
        }),
      ]
    : [
        curryCommandCreator(dropTip, {
          pipette,
          dropTipLocation,
        }),
        curryCommandCreator(_pickUpTip, {
          pipette,
          tiprack: nextTiprack.tiprackId,
          well: nextTiprack.well,
        }),
      ]

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
