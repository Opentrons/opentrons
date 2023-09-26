import { uuid } from '../../utils'
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
  const additionalEquipment = Object.values(
    invariantContext.additionalEquipmentEntities
  ).find(aE => aE.name === 'trashBin')?.id

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
        //  TODO(jr, 9/25/23): need to plug it in if there is no trash bin
        labwareId: additionalEquipment ?? '',
        wellName: 'A1',
      },
      //  TODO(jr, 7/17/23): add WellLocation params!
    },
  ]
  return {
    commands,
  }
}
