import { ALL, COLUMN, NozzleConfigurationStyle } from '@opentrons/shared-data'
import { getNextTiprack } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import { COLUMN_4_SLOTS } from '../../constants'
import { movableTrashCommandsUtil } from '../../utils/movableTrashCommandsUtil'
import {
  curryCommandCreator,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerEastWestWithLatchOpen,
  getIsTallLabwareWestOf96Channel,
  getLabwareSlot,
  modulePipetteCollision,
  pipetteAdjacentHeaterShakerWhileShaking,
  reduceCommandCreators,
  uuid,
  wasteChuteCommandsUtil,
  getWasteChuteAddressableAreaNamePip,
} from '../../utils'
import { dropTip } from './dropTip'
import type {
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
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
  nozzles?: NozzleConfigurationStyle
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
  const { pipette, dropTipLocation, nozzles } = args
  const { nextTiprack, tipracks } = getNextTiprack(
    pipette,
    invariantContext,
    prevRobotState,
    nozzles
  )
  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec
  const channels = pipetteSpec?.channels
  const hasMoreTipracksOnDeck =
    tipracks?.totalTipracks > tipracks?.filteredTipracks

  const is96ChannelTipracksAvailable =
    nextTiprack == null && channels === 96 && hasMoreTipracksOnDeck
  if (nozzles === ALL && is96ChannelTipracksAvailable) {
    return {
      errors: [errorCreators.missingAdapter()],
    }
  }

  if (nozzles === COLUMN && is96ChannelTipracksAvailable) {
    return {
      errors: [errorCreators.removeAdapter()],
    }
  }

  if (nextTiprack == null) {
    // no valid next tip / tiprack, bail out
    return {
      errors: [errorCreators.insufficientTips()],
    }
  }

  const isFlexPipette =
    (pipetteSpec?.displayCategory === 'FLEX' || channels === 96) ?? false

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
    invariantContext.additionalEquipmentEntities[dropTipLocation] != null &&
    invariantContext.additionalEquipmentEntities[dropTipLocation].name ===
      'wasteChute'

  const isTrashBin =
    invariantContext.additionalEquipmentEntities[dropTipLocation] != null &&
    invariantContext.additionalEquipmentEntities[dropTipLocation].name ===
      'trashBin'

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
    !args.dropTipLocation ||
    !invariantContext.additionalEquipmentEntities[args.dropTipLocation]
  ) {
    return { errors: [errorCreators.dropTipLocationDoesNotExist()] }
  }
  if (
    channels === 96 &&
    nozzles === COLUMN &&
    getIsTallLabwareWestOf96Channel(
      prevRobotState,
      invariantContext,
      nextTiprack.tiprackId,
      pipette
    )
  ) {
    return {
      errors: [
        errorCreators.tallLabwareWestOf96ChannelPipetteLabware({
          source: 'tiprack',
          labware:
            invariantContext.labwareEntities[nextTiprack.tiprackId].def.metadata
              .displayName,
        }),
      ],
    }
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

  const channels = pipetteSpec.channels
  const addressableAreaNameWasteChute = getWasteChuteAddressableAreaNamePip(
    channels
  )
  let commandCreators: CurriedCommandCreator[] = [
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
  if (isWasteChute) {
    commandCreators = [
      ...wasteChuteCommandsUtil({
        type: 'dropTip',
        pipetteId: pipette,
        addressableAreaName: addressableAreaNameWasteChute,
        prevRobotState,
      }),
      curryCommandCreator(_pickUpTip, {
        pipette,
        tiprack: nextTiprack.tiprackId,
        well: nextTiprack.well,
      }),
    ]
  }
  if (isTrashBin) {
    commandCreators = [
      ...movableTrashCommandsUtil({
        type: 'dropTip',
        pipetteId: pipette,
        prevRobotState,
        invariantContext,
      }),
      curryCommandCreator(_pickUpTip, {
        pipette,
        tiprack: nextTiprack.tiprackId,
        well: nextTiprack.well,
      }),
    ]
  }

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
