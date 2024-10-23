import { uuid, getLabwareSlot } from '../../utils'
import { COLUMN_4_SLOTS } from '../../constants'
import * as errorCreators from '../../errorCreators'
import type { CreateCommand, BlowoutParams } from '@opentrons/shared-data'
import type { CommandCreatorError, CommandCreator } from '../../types'

export const blowout: CommandCreator<BlowoutParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** Blowout with given args. Requires tip. */
  const { pipetteId, labwareId, wellName, wellLocation, flowRate } = args

  const actionName = 'blowout'
  const errors: CommandCreatorError[] = []
  const pipetteData = prevRobotState.pipettes[pipetteId]
  const labwareState = prevRobotState.labware
  const slotName = getLabwareSlot(
    labwareId,
    prevRobotState.labware,
    prevRobotState.modules
  )
  // TODO Ian 2018-04-30 this logic using command creator args + robotstate to push errors
  // is duplicated across several command creators (eg aspirate & blowout overlap).
  // You can probably make higher-level error creator util fns to be more DRY
  if (!pipetteData) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }

  if (!prevRobotState.tipState.pipettes[pipetteId]) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName,
        pipette: pipetteId,
        labware: labwareId,
        well: wellName,
      })
    )
  }

  if (!labwareId || !prevRobotState.labware[labwareId]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: labwareId,
      })
    )
  } else if (prevRobotState.labware[labwareId]?.slot === 'offDeck') {
    errors.push(errorCreators.labwareOffDeck())
  }

  if (COLUMN_4_SLOTS.includes(slotName)) {
    errors.push(errorCreators.pipettingIntoColumn4({ typeOfStep: actionName }))
  } else if (labwareState[slotName] != null) {
    const adapterSlot = labwareState[slotName].slot
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(
        errorCreators.pipettingIntoColumn4({ typeOfStep: actionName })
      )
    }
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const commands: CreateCommand[] = [
    {
      commandType: 'blowout',
      key: uuid(),
      params: {
        pipetteId,
        labwareId,
        wellName,
        flowRate,
        wellLocation: {
          origin: 'top',
          offset: {
            z: wellLocation?.offset?.z,
          },
        },
      },
    },
  ]
  return {
    commands,
  }
}
