import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
export interface BlowOutInPlaceArgs {
  pipetteId: string
  flowRate: number
}

export const blowOutInPlace: CommandCreator<BlowOutInPlaceArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, flowRate } = args

  const commands = [
    {
      commandType: 'blowOutInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        flowRate,
      },
    },
  ]
  return {
    commands,
  }
}
