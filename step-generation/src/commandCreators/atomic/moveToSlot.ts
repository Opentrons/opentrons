import * as errorCreators from '../../errorCreators'
import { isValidSlot } from '../../utils/isValidSlot'
import type { MoveToSlotParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { CommandCreator, CommandCreatorError } from '../../types'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
export const moveToSlot: CommandCreator<MoveToSlotParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, slot, offset, minimumZHeight, forceDirect } = args
  const actionName = 'moveToSlot'
  const errors: CommandCreatorError[] = []
  const pipetteData = prevRobotState.pipettes[pipette]

  if (!pipetteData) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette,
      })
    )
  }

  if (!isValidSlot(slot)) {
    errors.push(
      errorCreators.invalidSlot({
        actionName,
        slot,
      })
    )
  }

  const commands: Command[] = [
    {
      command: 'moveToSlot',
      params: {
        pipette,
        slot,
        offset,
        minimumZHeight,
        forceDirect,
      },
    },
  ]

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  return {
    commands,
  }
}
