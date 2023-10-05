import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
interface DropTipArgs {
  pipette: string
  dropTipLocation: string
}

/** Drop tip if given pipette has a tip. If it has no tip, do nothing. */
export const dropTip: CommandCreator<DropTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, dropTipLocation } = args
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
        //  TODO(jr, 10/02/23): this param will probably be slightly changed in order to drop tip to waste chute
        //  since there is no labwareId or wellName for it
        labwareId: dropTipLocation,
        wellName: 'A1',
      },
      //  TODO(jr, 7/17/23): add WellLocation params!
    },
  ]
  return {
    commands,
  }
}
