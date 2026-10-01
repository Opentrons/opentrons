import {
  A12_NOZZLE,
  A1_NOZZLE,
  ALL,
  B1_NOZZLE,
  C1_NOZZLE,
  COLUMN,
  D1_NOZZLE,
  E1_NOZZLE,
  F1_NOZZLE,
  G1_NOZZLE,
  H12_NOZZLE,
  H1_NOZZLE,
  PARTIAL_COLUMN,
  QUADRANT,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  indentPyLines,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  ConfigureNozzleLayoutStepGenArgs,
  RuntimeParameters,
} from '../../types'

const NOZZLE_STYLES: readonly string[] = [
  ALL,
  COLUMN,
  SINGLE,
  ROW,
  QUADRANT,
  PARTIAL_COLUMN,
]
const PRIMARY_NOZZLES: readonly string[] = [
  A1_NOZZLE,
  A12_NOZZLE,
  B1_NOZZLE,
  C1_NOZZLE,
  D1_NOZZLE,
  E1_NOZZLE,
  F1_NOZZLE,
  G1_NOZZLE,
  H1_NOZZLE,
  H12_NOZZLE,
]
const BACK_LEFT_NOZZLES: readonly string[] = [
  B1_NOZZLE,
  C1_NOZZLE,
  D1_NOZZLE,
  E1_NOZZLE,
  F1_NOZZLE,
  G1_NOZZLE,
]

function resolveAllowedRuntimeValue(
  value: string,
  allowed: readonly string[],
  runtimeParameters: RuntimeParameters
): string | null {
  const resolved = resolveStringRuntimeValue(value, runtimeParameters)
  if (resolved == null || !allowed.includes(resolved)) {
    return null
  }
  return resolved
}

function pythonRuntimeString(
  raw: string,
  resolved: string,
  runtimeParameters: RuntimeParameters
): string {
  if (runtimeParameters[raw] != null) {
    return raw
  }
  return formatPyStr(resolved)
}

export const configureNozzleLayout: CommandCreator<
  ConfigureNozzleLayoutStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { pipetteId, configurationParams } = args
  const { style, primaryNozzle, backLeftNozzle } = configurationParams
  const { runtimeParameters } = invariantContext
  const resolvedPipetteId = resolveStringRuntimeValue(
    pipetteId,
    runtimeParameters
  )
  const resolvedStyle = resolveAllowedRuntimeValue(
    style,
    NOZZLE_STYLES,
    runtimeParameters
  )
  const resolvedPrimaryNozzle =
    primaryNozzle == null
      ? undefined
      : resolveAllowedRuntimeValue(
          primaryNozzle,
          PRIMARY_NOZZLES,
          runtimeParameters
        )
  const resolvedBackLeftNozzle =
    backLeftNozzle == null
      ? undefined
      : resolveAllowedRuntimeValue(
          backLeftNozzle,
          BACK_LEFT_NOZZLES,
          runtimeParameters
        )
  const errors: CommandCreatorError[] = []
  if (resolvedPipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: pipetteId })
    )
  }
  if (resolvedStyle == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: style })
    )
  }
  if (primaryNozzle != null && resolvedPrimaryNozzle == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: primaryNozzle })
    )
  }
  if (backLeftNozzle != null && resolvedBackLeftNozzle == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: backLeftNozzle,
      })
    )
  }
  if (
    resolvedPipetteId == null ||
    resolvedStyle == null ||
    (primaryNozzle != null && resolvedPrimaryNozzle == null) ||
    (backLeftNozzle != null && resolvedBackLeftNozzle == null)
  ) {
    return { errors }
  }

  const pythonName =
    invariantContext.pipetteEntities[resolvedPipetteId].pythonName
  let stylePython = `protocol_api.${resolvedStyle}`
  if (runtimeParameters[style] != null) {
    stylePython = style
  }
  const pythonArgs = [stylePython]
  if (primaryNozzle != null && resolvedPrimaryNozzle != null) {
    const primaryNozzlePython = pythonRuntimeString(
      primaryNozzle,
      resolvedPrimaryNozzle,
      runtimeParameters
    )
    if (resolvedStyle === PARTIAL_COLUMN) {
      pythonArgs.push(
        `start=${formatPyStr(H1_NOZZLE)}, end=${primaryNozzlePython}`
      )
    } else {
      pythonArgs.push(`start=${primaryNozzlePython}`)
    }
  }
  if (backLeftNozzle != null && resolvedBackLeftNozzle != null) {
    pythonArgs.push(
      `back_left=${pythonRuntimeString(
        backLeftNozzle,
        resolvedBackLeftNozzle,
        runtimeParameters
      )}`
    )
  }

  const resolvedConfigurationParams = {
    style: resolvedStyle as NozzleConfigurationStyle,
    ...(resolvedPrimaryNozzle != null
      ? {
          primaryNozzle:
            resolvedPrimaryNozzle as PrimaryNozzleConfigurationStyle,
        }
      : {}),
    ...(resolvedBackLeftNozzle != null
      ? {
          backLeftNozzle: resolvedBackLeftNozzle as PartialPrimaryNozzles,
        }
      : {}),
  }

  return {
    commands: [
      {
        commandType: 'configureNozzleLayout' as const,
        key: uuid(),
        params: {
          pipetteId: resolvedPipetteId,
          configurationParams: resolvedConfigurationParams,
        },
      },
    ],
    python: `${pythonName}.configure_nozzle_layout(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  }
}
