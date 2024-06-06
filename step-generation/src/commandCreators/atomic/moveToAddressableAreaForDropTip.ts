import type { AddressableAreaName } from '@opentrons/shared-data'

import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'

export interface MoveToAddressableAreaForDropTipArgs {
  pipetteId: string
  addressableAreaName: AddressableAreaName
}
export const moveToAddressableAreaForDropTip: CommandCreator<MoveToAddressableAreaForDropTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, addressableAreaName } = args

  const commands = [
    {
      commandType: 'moveToAddressableAreaForDropTip' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName,
        offset: { x: 0, y: 0, z: 0 },
        alternateDropLocation: true,
      },
    },
  ]
  return {
    commands,
  }
}
