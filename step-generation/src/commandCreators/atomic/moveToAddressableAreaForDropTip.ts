import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type { AddressableAreaName } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const moveToAddressableAreaForDropTip: CommandCreator<{
  pipetteId: string
  addressableAreaName: string
  offset?: {
    x: number | string
    y: number | string
    z: number | string
  }
  alternateDropLocation?: boolean | string
  speed?: number | string
  minimumZHeight?: number | string
  forceDirect?: boolean | string
}> = (args, invariantContext, prevRobotState) => {
  const runtimeParameters = invariantContext.runtimeParameters ?? {}
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const addressableAreaName = resolveStringRuntimeValue(
    args.addressableAreaName,
    runtimeParameters
  )
  const errors: CommandCreatorError[] = []
  if (pipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.pipetteId })
    )
  }
  if (addressableAreaName == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.addressableAreaName,
      })
    )
  }
  if (errors.length > 0 || pipetteId == null || addressableAreaName == null) {
    return { errors }
  }

  const commands = [
    {
      commandType: 'moveToAddressableAreaForDropTip' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName: addressableAreaName as AddressableAreaName,
        offset: { x: 0, y: 0, z: 0 },
        alternateDropLocation: true,
      },
    },
  ]
  return {
    commands,
  }
}
