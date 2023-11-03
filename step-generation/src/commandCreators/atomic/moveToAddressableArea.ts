import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'

export interface MoveToAddressableAreaArgs {
  pipetteId: string
  addressableAreaName: string
}
export const moveToAddressableArea: CommandCreator<MoveToAddressableAreaArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, addressableAreaName } = args

  // No-op if there is no pipette
  if (!invariantContext.pipetteEntities[pipetteId]) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      commandType: 'moveToAddressableArea' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName,
        speed: 12.3,
        minimumZHeight: 1.23,
        forceDirect: false,
      },
    },
  ]
  return {
    commands,
  }
}
