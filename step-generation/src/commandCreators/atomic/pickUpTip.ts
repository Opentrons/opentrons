import { AUTOMATIC, COLUMN_4_SLOTS, MANUAL } from '../../constants'
import {
  incompletePickup,
  pipettingIntoColumn4,
  possiblePipetteCollision,
  tooManyTips,
} from '../../errorCreators'
import {
  formatPyStr,
  getIsSafePickupWithinTiprack,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
  uuid,
} from '../../utils'

import type {
  NozzleConfigurationStyle,
  PickUpTipParams,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  TipTrackingOption,
} from '../../types'

interface PickUpTipAtomicParams extends PickUpTipParams {
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzles: NozzleConfigurationStyle
  tipTrackingOption?: TipTrackingOption
}

export const pickUpTip: CommandCreator<PickUpTipAtomicParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    pipetteId,
    labwareId,
    wellName,
    tipTrackingOption = AUTOMATIC,
    nozzles,
    primaryNozzle,
  } = args
  const errors: CommandCreatorError[] = []
  const channels = invariantContext.pipetteEntities[pipetteId].spec.channels
  const pipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
    robotState: prevRobotState,
    invariantContext,
    pipetteId,
    labwareId,
    //  we don't adjust the offset when moving to the tiprack
    wellLocationOffset: { x: 0, y: 0 },
    wellTargetName: wellName,
    nozzleConfiguration: nozzles,
    primaryNozzle: primaryNozzle,
  })

  const isSafeWithinTiprack = getIsSafePickupWithinTiprack({
    tipState: prevRobotState.tipState.tipracks[labwareId],
    primaryNozzle,
    channels,
    nozzleConfiguration: nozzles,
    wellName,
    tiprackDef: invariantContext.labwareEntities[labwareId].def,
  })

  if (!pipetteMovementSafetyStatus.isSafe) {
    errors.push(
      possiblePipetteCollision({
        unsafePipetteMovementReason: pipetteMovementSafetyStatus.reason,
      })
    )
  }

  if (!isSafeWithinTiprack.isSafe) {
    errors.push(tooManyTips())
  }

  if (isSafeWithinTiprack.isComplete !== true) {
    errors.push(incompletePickup())
  }

  const tiprackSlot = getSlotInLocationStack(
    prevRobotState.labware[labwareId].stack
  )
  if (COLUMN_4_SLOTS.includes(tiprackSlot)) {
    errors.push(pipettingIntoColumn4({ typeOfStep: 'pick up tip' }))
  } else if (prevRobotState.labware[tiprackSlot] != null) {
    const adapterSlot = getSlotInLocationStack(
      prevRobotState.labware[tiprackSlot].stack
    )
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(pipettingIntoColumn4({ typeOfStep: 'pick up tip' }))
    }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const tiprackPythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  // We don't specify the tip well because it would make it hard for users to modify
  // the Python protocol. We do specify the tip rack because multiple tip racks could be
  // assigned to the pipette, and the UI makes the user choose which tip rack to use.
  const python = `${pipettePythonName}.pick_up_tip(location=${tiprackPythonName}${tipTrackingOption === MANUAL ? `[${formatPyStr(wellName)}]` : ''})`

  if (errors.length > 0) {
    return { errors }
  }
  return {
    commands: [
      {
        commandType: 'pickUpTip',
        key: uuid(),
        params: {
          pipetteId,
          labwareId,
          wellName,
        },
      },
    ],
    python,
  }
}
