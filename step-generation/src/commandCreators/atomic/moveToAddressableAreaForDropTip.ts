import * as errorCreators from '../../errorCreators'
import {
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { AddressableAreaName } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveToAddressableAreaForDropTipStepGenArgs,
} from '../../types'

export const moveToAddressableAreaForDropTip: CommandCreator<
  MoveToAddressableAreaForDropTipStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { runtimeParameters } = invariantContext
  const offset = args.offset ?? { x: 0, y: 0, z: 0 }
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const addressableAreaName = resolveStringRuntimeValue(
    args.addressableAreaName,
    runtimeParameters
  )
  const offsetX = resolveNumericRuntimeValue(offset.x, runtimeParameters)
  const offsetY = resolveNumericRuntimeValue(offset.y, runtimeParameters)
  const offsetZ = resolveNumericRuntimeValue(offset.z, runtimeParameters)
  const alternateDropLocation = resolveBooleanRuntimeValue(
    args.alternateDropLocation ?? true,
    runtimeParameters
  )
  const speed =
    args.speed == null
      ? undefined
      : resolveNumericRuntimeValue(args.speed, runtimeParameters)
  const minimumZHeight =
    args.minimumZHeight == null
      ? undefined
      : resolveNumericRuntimeValue(args.minimumZHeight, runtimeParameters)
  const forceDirect =
    args.forceDirect == null
      ? undefined
      : resolveBooleanRuntimeValue(args.forceDirect, runtimeParameters)
  const ignoreTipConfiguration =
    args.ignoreTipConfiguration == null
      ? undefined
      : resolveBooleanRuntimeValue(
          args.ignoreTipConfiguration,
          runtimeParameters
        )
  const rawValues = [
    args.pipetteId,
    args.addressableAreaName,
    args.offset?.x,
    args.offset?.y,
    args.offset?.z,
    args.alternateDropLocation,
    args.speed,
    args.minimumZHeight,
    args.forceDirect,
    args.ignoreTipConfiguration,
  ]
  const resolvedValues = [
    pipetteId,
    addressableAreaName,
    offsetX,
    offsetY,
    offsetZ,
    alternateDropLocation,
    speed,
    minimumZHeight,
    forceDirect,
    ignoreTipConfiguration,
  ]
  const errors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    pipetteId == null ||
    addressableAreaName == null ||
    offsetX == null ||
    offsetY == null ||
    offsetZ == null ||
    alternateDropLocation == null
  ) {
    return { errors }
  }

  return {
    commands: [
      {
        commandType: 'moveToAddressableAreaForDropTip' as const,
        key: uuid(),
        params: {
          pipetteId,
          addressableAreaName: addressableAreaName as AddressableAreaName,
          offset: { x: offsetX, y: offsetY, z: offsetZ },
          alternateDropLocation,
          ...(speed != null ? { speed } : {}),
          ...(minimumZHeight != null ? { minimumZHeight } : {}),
          ...(forceDirect != null ? { forceDirect } : {}),
          ...(ignoreTipConfiguration != null
            ? { ignoreTipConfiguration }
            : {}),
        },
      },
    ],
  }
}
