import { noTipOnPipette, pipetteDoesNotExist } from '../../errorCreators'
import type { CommandCreator, CommandCreatorError } from '../../types'
import type { CreateCommand } from '@opentrons/shared-data'
import type { TouchTipParams } from '@opentrons/shared-data/protocol/types/schemaV3'

export const touchTip: CommandCreator<TouchTipParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** touchTip with given args. Requires tip. */
  const actionName = 'touchTip'
  const { pipette, labware, well, offsetFromBottomMm } = args
  const pipetteData = prevRobotState.pipettes[pipette]
  const errors: CommandCreatorError[] = []

  if (!pipetteData) {
    errors.push(
      pipetteDoesNotExist({
        actionName,
        pipette,
      })
    )
  }

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(
      noTipOnPipette({
        actionName,
        pipette,
        labware,
        well,
      })
    )
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const commands: CreateCommand[] = [
    {
      commandType: 'touchTip',
      params: {
        pipetteId: pipette,
        labwareId: labware,
        wellName: well,
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
