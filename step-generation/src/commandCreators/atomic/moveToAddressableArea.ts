import type { AddressableAreaName } from '@opentrons/shared-data'

import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'

export interface MoveToAddressableAreaArgs {
  pipetteId: string
  addressableAreaName: AddressableAreaName
}
export const moveToAddressableArea: CommandCreator<MoveToAddressableAreaArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, addressableAreaName } = args

  const commands = [
    {
      commandType: 'moveToAddressableArea' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName,
        offset: { x: 0, y: 0, z: 0 },
      },
    },
  ]
  return {
    commands,
  }
}
