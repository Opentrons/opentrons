import { uuid } from '../../utils'
import * as errorCreators from '../../errorCreators'
import type { BlowoutParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { CommandCreatorError, CommandCreator } from '../../types'
import { CreateCommand } from '@opentrons/shared-data'

export const blowout: CommandCreator<BlowoutParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** Blowout with given args. Requires tip. */
  const { pipette, labware, well, offsetFromBottomMm, flowRate } = args
  const actionName = 'blowout'
  const errors: CommandCreatorError[] = []
  const pipetteData = prevRobotState.pipettes[pipette]

  // TODO Ian 2018-04-30 this logic using command creator args + robotstate to push errors
  // is duplicated across several command creators (eg aspirate & blowout overlap).
  // You can probably make higher-level error creator util fns to be more DRY
  if (!pipetteData) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette,
      })
    )
  }

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName,
        pipette,
        labware,
        well,
      })
    )
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware,
      })
    )
  } else if (prevRobotState.labware[labware].slot === 'offDeck') {
    errors.push(errorCreators.labwareOffDeck())
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
        pipetteId: pipette,
        labwareId: labware,
        wellName: well,
        flowRate,
        wellLocation: {
          origin: 'bottom',
          offset: {
            z: offsetFromBottomMm,
          },
        },
      },
    },
  ]
  return {
    commands,
  }
}
