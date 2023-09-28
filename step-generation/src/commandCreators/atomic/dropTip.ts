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
  const { labwareEntities } = invariantContext
  const trashId = Object.values(labwareEntities).find(lw =>
    lw.def.parameters.quirks?.includes('fixedTrash')
  )?.id
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
        //  TODO(jr, 9/26/23): support no trash, return tip and waste chute
        labwareId: trashId != null ? trashId : '',
        wellName: 'A1',
      },
      //  TODO(jr, 7/17/23): add WellLocation params!
    },
  ]
  return {
    commands,
  }
}
