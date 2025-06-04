import { COLUMN_4_SLOTS } from '../../constants'
import {
  pipettingIntoColumn4,
  possiblePipetteCollision,
} from '../../errorCreators'
import {
  getIsSafePipetteMovement,
  getSlotInLocationStack,
  uuid,
} from '../../utils'

import type {
  NozzleConfigurationStyle,
  PickUpTipParams,
} from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

interface PickUpTipAtomicParams extends PickUpTipParams {
  nozzles?: NozzleConfigurationStyle
}

export const pickUpTip: CommandCreator<PickUpTipAtomicParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, labwareId, wellName } = args
  const errors: CommandCreatorError[] = []

  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipetteId]?.spec.channels !== 1

  if (
    isMultiChannelPipette &&
    !getIsSafePipetteMovement({
      robotState: prevRobotState,
      invariantContext,
      pipetteId,
      labwareId,
      //  we don't adjust the offset when moving to the tiprack
      wellLocationOffset: { x: 0, y: 0 },
      wellTargetName: wellName,
    })
  ) {
    errors.push(possiblePipetteCollision())
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
  const python = `${pipettePythonName}.pick_up_tip(location=${tiprackPythonName})`

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
