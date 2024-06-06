import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
interface DropTipArgs {
  pipette: string
  dropTipLocation: string
}

//  NOTE(jr, 12/1/23): this atomic command is not in use currently for PD 8.0
//  since we only support dropping tip into the waste chute or trash bin
//  which are both addressableAreas (so the commands are moveToAddressableArea
//  and dropTipInPlace) We will use this again when we add return tip
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
