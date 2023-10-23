import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
interface configureForVolumeArgs {
  pipetteId: string
  volume: number
}

export const configureForVolume: CommandCreator<configureForVolumeArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume } = args

  // No-op if there is no pipette
  if (!invariantContext.pipetteEntities[pipetteId]) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      commandType: 'configureForVolume' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
      },
    },
  ]
  return {
    commands,
  }
}
