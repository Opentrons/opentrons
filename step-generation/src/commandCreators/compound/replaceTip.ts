import {
  ALL,
  COLUMN,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { AUTOMATIC, MANUAL } from '../../constants'
import * as errorCreators from '../../errorCreators'
import { getNextTiprack } from '../../robotStateSelectors'
import {
  curryCommandCreator,
  curryWithoutPython,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerEastWestWithLatchOpen,
  getLabwareSlot,
  modulePipetteCollision,
  pipetteAdjacentHeaterShakerWhileShaking,
  reduceCommandCreators,
} from '../../utils'
import { configureNozzleLayout } from '../atomic/configureNozzleLayout'
import { dropTip } from '../atomic/dropTip'
import { pickUpTip } from '../atomic/pickUpTip'
import { dropTipInTrash } from './dropTipInTrash'
import { dropTipInWasteChute } from './dropTipInWasteChute'

import type {
  CutoutId,
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { CommandCreator, CurriedCommandCreator } from '../../types'

interface ReplaceTipArgs {
  pipette: string
  dropTipLocation: string
  // tipRack URI with which to automatically find next tip
  tipRack: string | null
  nozzles: NozzleConfigurationStyle
  primaryNozzle: PrimaryNozzleConfigurationStyle

  //  we need to emit atomic commands for python
  //  if this replaceTip is for the mix compound command
  isFromMixCommand?: boolean
  // optional explicit tiprack id and well name to pickup from (if not provided, will automatically find next tip from tipRack URI)
  tipSelectionArgs?: {
    tipRackId: string
    tipWell: string
  }
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
  const {
    pipette,
    dropTipLocation,
    nozzles,
    primaryNozzle,
    tipRack,
    isFromMixCommand = false,
    tipSelectionArgs,
  } = args
  const stateNozzles = prevRobotState.pipettes[pipette].nozzles
  const stateTiprack = prevRobotState.pipettes[pipette].tiprackId
  const pipetteSpec = invariantContext.pipetteEntities[pipette]?.spec
  const channels = pipetteSpec?.channels

  let nextTiprack: { tiprackId: string; well: string } | null = null

  if (tipSelectionArgs == null) {
    // automatic tip selection (legacy)
    if (tipRack == null) {
      return {
        errors: [errorCreators.noTipSelected()],
      }
    }
    const nextTiprackResult = getNextTiprack(
      pipette,
      tipRack,
      invariantContext,
      prevRobotState,
      primaryNozzle,
      nozzles
    )

    nextTiprack = nextTiprackResult.nextTiprack
    const tipracks = nextTiprackResult.tipracks

    const { excludedBy96Channel, excludedByLid } = tipracks ?? {}

    const is96ChannelTipracksAvailable =
      nextTiprack == null && channels === 96 && excludedBy96Channel > 0
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
    if (excludedByLid > 0 && nextTiprack == null) {
      return {
        errors: [errorCreators.nextTiprackHasLid()],
      }
    }
  } else {
    // manual tip selection
    nextTiprack = {
      tiprackId: tipSelectionArgs.tipRackId,
      well: tipSelectionArgs.tipWell,
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

  if (!pipetteSpec) {
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
          pipette,
        }),
      ],
    }
  }
  const labwareDef =
    invariantContext.labwareEntities[nextTiprack.tiprackId]?.def

  const isWasteChute =
    invariantContext.wasteChuteEntities[dropTipLocation] != null
  const isTrashBin = invariantContext.trashBinEntities[dropTipLocation] != null

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

  const hasTip = prevRobotState.tipState.pipettes[pipette]?.hasTip

  if (!dropTipLocation || (!isWasteChute && !isTrashBin && hasTip)) {
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

  const slotName = getLabwareSlot(nextTiprack.tiprackId, prevRobotState.labware)
  if (
    pipetteAdjacentHeaterShakerWhileShaking(
      prevRobotState.modules,
      slotName,
      isFlexPipette ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
    )
  ) {
    return {
      errors: [errorCreators.heaterShakerNorthSouthEastWestShaking()],
    }
  }
  if (!isFlexPipette) {
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

  const curryCommand = isFromMixCommand
    ? curryCommandCreator
    : curryWithoutPython

  const configureNozzleLayoutCommand: CurriedCommandCreator[] = []

  // only emit the command if previous nozzle state and tiprack state are different
  // only check for the 96-channel since we do not support 8-channel partial tip yet
  if (
    channels !== 1 &&
    args.nozzles != null &&
    (args.nozzles !== stateNozzles || nextTiprack.tiprackId !== stateTiprack)
  ) {
    configureNozzleLayoutCommand.push(
      curryCommandCreator(configureNozzleLayout, {
        configurationParams: {
          primaryNozzle,
          style: args.nozzles,
        },
        pipetteId: args.pipette,
      })
    )
  }

  const tipTrackingOption = tipSelectionArgs ? MANUAL : AUTOMATIC
  let commandCreators: CurriedCommandCreator[] = [
    curryCommand(dropTip, {
      pipette,
      dropTipLocation,
    }),
    ...configureNozzleLayoutCommand,
    curryCommand(pickUpTip, {
      pipetteId: pipette,
      labwareId: nextTiprack.tiprackId,
      wellName: nextTiprack.well,
      nozzles: args.nozzles,
      tipTrackingOption,
      primaryNozzle,
    }),
  ]
  if (isWasteChute) {
    commandCreators = [
      curryCommand(dropTipInWasteChute, {
        pipetteId: args.pipette,
        wasteChuteId:
          invariantContext.wasteChuteEntities[args.dropTipLocation].id,
      }),
      ...configureNozzleLayoutCommand,
      curryCommand(pickUpTip, {
        pipetteId: pipette,
        labwareId: nextTiprack.tiprackId,
        wellName: nextTiprack.well,
        nozzles: args.nozzles,
        tipTrackingOption,
        primaryNozzle,
      }),
    ]
  }
  if (isTrashBin) {
    commandCreators = [
      curryCommand(dropTipInTrash, {
        pipetteId: pipette,
        trashLocation: invariantContext.trashBinEntities[args.dropTipLocation]
          .location as CutoutId,
      }),
      ...configureNozzleLayoutCommand,
      curryCommand(pickUpTip, {
        pipetteId: pipette,
        labwareId: nextTiprack.tiprackId,
        wellName: nextTiprack.well,
        nozzles: args.nozzles,
        tipTrackingOption,
        primaryNozzle,
      }),
    ]
  }

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
