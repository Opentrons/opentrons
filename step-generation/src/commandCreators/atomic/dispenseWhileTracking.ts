import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  formatPyWellLocation,
  indentPyLines,
  resolveNumericRuntimeValue,
  resolveRuntimeWellLocation,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { DispenseWhileTrackingParams } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  DispenseWhileTrackingStepGenArgs,
} from '../../types'

export const dispenseWhileTracking: CommandCreator<
  DispenseWhileTrackingStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const wellName = resolveStringRuntimeValue(args.wellName, runtimeParameters)
  const volume = resolveNumericRuntimeValue(args.volume, runtimeParameters)
  const flowRate = resolveNumericRuntimeValue(args.flowRate, runtimeParameters)
  const pushOut =
    args.pushOut == null
      ? undefined
      : resolveNumericRuntimeValue(args.pushOut, runtimeParameters)
  const trackFrom = resolveRuntimeWellLocation(
    args.trackFromLocation,
    runtimeParameters
  )
  const trackTo = resolveRuntimeWellLocation(
    args.trackToLocation,
    runtimeParameters
  )
  const rawValues = [
    args.pipetteId,
    args.labwareId,
    args.wellName,
    args.volume,
    args.flowRate,
    args.pushOut,
  ]
  const resolvedValues = [
    pipetteId,
    labwareId,
    wellName,
    volume,
    flowRate,
    pushOut,
  ]
  const errors: CommandCreatorError[] = [
    ...rawValues.flatMap((value, i) =>
      typeof value === 'string' && resolvedValues[i] == null
        ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
        : []
    ),
    ...[
      ...trackFrom.invalidParameterNames,
      ...trackTo.invalidParameterNames,
    ].map(parameterName =>
      errorCreators.invalidRuntimeParameter({ parameterName })
    ),
  ]
  if (
    errors.length > 0 ||
    pipetteId == null ||
    labwareId == null ||
    wellName == null ||
    volume == null ||
    flowRate == null ||
    trackFrom.location == null ||
    trackTo.location == null
  ) {
    return { errors }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  const pythonWellName =
    runtimeParameters[args.wellName] != null
      ? args.wellName
      : formatPyStr(wellName)
  const wellRef = `${labwarePythonName}[${pythonWellName}]`
  const pythonArgs = [
    `volume=${args.volume}`,
    `location=${wellRef}${formatPyWellLocation({
      origin: trackFrom.location.origin,
      offset: args.trackFromLocation.offset,
    })}`,
    `flow_rate=${args.flowRate}`,
    `end_location=${wellRef}${formatPyWellLocation({
      origin: trackTo.location.origin,
      offset: args.trackToLocation.offset,
    })}`,
    ...(args.pushOut != null ? [`push_out=${args.pushOut}`] : []),
  ]
  return {
    commands: [
      {
        commandType: 'dispenseWhileTracking' as const,
        key: uuid(),
        params: {
          pipetteId,
          volume,
          flowRate,
          labwareId,
          wellName,
          trackFromLocation:
            trackFrom.location as DispenseWhileTrackingParams['trackFromLocation'],
          trackToLocation:
            trackTo.location as DispenseWhileTrackingParams['trackToLocation'],
          ...(pushOut != null ? { pushOut } : {}),
        },
      },
    ],
    python: `${pipettePythonName}.dispense(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  }
}
