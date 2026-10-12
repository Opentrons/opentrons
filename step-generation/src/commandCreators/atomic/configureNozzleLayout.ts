import { H1_NOZZLE, PARTIAL_COLUMN } from '@opentrons/shared-data'

import {
  BACK_LEFT_NOZZLES,
  NOZZLE_STYLES,
  PRIMARY_NOZZLES,
} from '../../constants'
import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  indentPyLines,
  pythonRuntimeString,
  resolveAllowedRuntimeValue,
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
} from '../../types'

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
    errors.push(errorCreators.invalidRuntimeParameter({ parameterName: style }))
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
