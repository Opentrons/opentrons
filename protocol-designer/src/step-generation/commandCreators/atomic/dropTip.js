// @flow
import { FIXED_TRASH_ID } from '../../../constants'
import type { CommandCreator } from '../../types'

type DropTipArgs = {| pipette: string |}
/** Drop tip if given pipette has a tip. If it has no tip, do nothing. */
const dropTip: CommandCreator<DropTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette } = args
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipette]) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      command: 'dropTip',
      params: {
        pipette,
        labware: FIXED_TRASH_ID,
        well: 'A1', // TODO: Is 'A1' of the trash always the right place to drop tips?
      },
    },
  ]

  return {
    commands,
  }
}

export default dropTip
