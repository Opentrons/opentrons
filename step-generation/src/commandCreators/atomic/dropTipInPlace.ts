import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
export interface DropTipInPlaceArgs {
  pipetteId: string
}

export const dropTipInPlace: CommandCreator<DropTipInPlaceArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId } = args
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipetteId]) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      commandType: 'dropTipInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
      },
    },
  ]
  return {
    commands,
  }
}
