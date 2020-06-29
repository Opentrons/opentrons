// @flow
import type { BlowoutParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'

import * as errorCreators from '../../errorCreators'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const blowout: CommandCreator<BlowoutParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** Blowout with given args. Requires tip. */
  const { pipette, labware, well, offsetFromBottomMm, flowRate } = args

  const actionName = 'blowout'
  const errors: Array<CommandCreatorError> = []

  const pipetteData = prevRobotState.pipettes[pipette]

  // TODO Ian 2018-04-30 this logic using command creator args + robotstate to push errors
  // is duplicated across several command creators (eg aspirate & blowout overlap).
  // You can probably make higher-level error creator util fns to be more DRY
  if (!pipetteData) {
    errors.push(errorCreators.pipetteDoesNotExist({ actionName, pipette }))
  }

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(
      errorCreators.noTipOnPipette({ actionName, pipette, labware, well })
    )
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({ actionName, labware }))
  }

  if (errors.length > 0) {
    return { errors }
  }

  const commands = [
    {
      command: 'blowout',
      params: {
        pipette,
        labware,
        well,
        flowRate,
        offsetFromBottomMm,
      },
    },
  ]

  return {
    commands,
  }
}
