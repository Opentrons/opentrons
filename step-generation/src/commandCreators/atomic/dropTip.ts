import { uuid } from '../../utils'
import { FIXED_TRASH_ID } from '../../constants'
import type { CommandCreator } from '../../types'
interface DropTipArgs {
  pipette: string
}

/** Drop tip if given pipette has a tip. If it has no tip, do nothing. */
export const dropTip: CommandCreator<DropTipArgs> = (
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
      commandType: 'dropTip' as const,
      key: uuid(),
      params: {
        pipetteId: pipette,
        labwareId: FIXED_TRASH_ID,
        wellName: 'A1',
      },
      //  TODO(jr, 7/17/23): add WellLocation params!
    },
  ]
  return {
    commands,
  }
}
