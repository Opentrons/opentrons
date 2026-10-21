import { NOZZLE_STYLES, PRIMARY_NOZZLES } from '../constants'
import {
  resolveAllowedRuntimeValue,
  resolveStringRuntimeValue,
} from '../utils'

import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  ConfigureNozzleLayoutStepGenArgs,
  InvariantContext,
  RobotStateAndWarnings,
} from '../types'

export function forConfigureNozzleLayout(
  params: ConfigureNozzleLayoutStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, configurationParams } = params
  const { style, primaryNozzle } = configurationParams
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
  if (
    resolvedPipetteId == null ||
    resolvedStyle == null ||
    (primaryNozzle != null && resolvedPrimaryNozzle == null)
  ) {
    console.error(
      `forConfigureNozzleLayout: arg resolved to null (pipetteId=${String(
        resolvedPipetteId
      )}, style=${String(resolvedStyle)}, primaryNozzle=${String(
        resolvedPrimaryNozzle
      )})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings

  robotState.pipettes[resolvedPipetteId].nozzles =
    resolvedStyle as NozzleConfigurationStyle
  robotState.pipettes[resolvedPipetteId].primaryNozzle =
    resolvedPrimaryNozzle == null
      ? undefined
      : (resolvedPrimaryNozzle as PrimaryNozzleConfigurationStyle)
}
