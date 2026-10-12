import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { WellLocation, WellOrigin } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  LiquidProbeStepGenArgs,
} from '../../types'

export const liquidProbe: CommandCreator<LiquidProbeStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const wellName = resolveStringRuntimeValue(args.wellName, runtimeParameters)
  const rawOrigin = args.wellLocation?.origin
  const origin =
    rawOrigin == null
      ? undefined
      : resolveStringRuntimeValue(rawOrigin, runtimeParameters)
  const rawOffset = args.wellLocation?.offset
  const offsetX =
    rawOffset?.x == null
      ? undefined
      : resolveNumericRuntimeValue(rawOffset.x, runtimeParameters)
  const offsetY =
    rawOffset?.y == null
      ? undefined
      : resolveNumericRuntimeValue(rawOffset.y, runtimeParameters)
  const offsetZ =
    rawOffset?.z == null
      ? undefined
      : resolveNumericRuntimeValue(rawOffset.z, runtimeParameters)

  const errors: CommandCreatorError[] = []
  for (const [parameterName, resolved] of [
    [args.pipetteId, pipetteId],
    [args.labwareId, labwareId],
    [args.wellName, wellName],
  ] as const) {
    if (resolved == null) {
      errors.push(errorCreators.invalidRuntimeParameter({ parameterName }))
    }
  }
  if (rawOrigin != null && origin == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: rawOrigin })
    )
  }
  for (const [parameterName, resolved] of [
    [rawOffset?.x, offsetX],
    [rawOffset?.y, offsetY],
    [rawOffset?.z, offsetZ],
  ] as const) {
    if (typeof parameterName === 'string' && resolved == null) {
      errors.push(errorCreators.invalidRuntimeParameter({ parameterName }))
    }
  }
  if (
    errors.length > 0 ||
    pipetteId == null ||
    labwareId == null ||
    wellName == null
  ) {
    return { errors }
  }

  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    return {
      commands: [],
    }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  let wellLocation: WellLocation | undefined
  if (args.wellLocation != null) {
    wellLocation = {}
    if (origin != null) {
      wellLocation.origin = origin as WellOrigin
    }
    if (rawOffset != null) {
      wellLocation.offset = {}
      if (offsetX != null) {
        wellLocation.offset.x = offsetX
      }
      if (offsetY != null) {
        wellLocation.offset.y = offsetY
      }
      if (offsetZ != null) {
        wellLocation.offset.z = offsetZ
      }
    }
  }
  const pythonWellName =
    runtimeParameters[args.wellName] != null
      ? args.wellName
      : formatPyStr(wellName)

  return {
    commands: [
      {
        commandType: 'liquidProbe' as const,
        key: uuid(),
        params: {
          pipetteId,
          labwareId,
          wellName,
          wellLocation,
        },
      },
    ],
    python: `${pipettePythonName}.measure_liquid_height(${labwarePythonName}[${pythonWellName}])`,
  }
}
