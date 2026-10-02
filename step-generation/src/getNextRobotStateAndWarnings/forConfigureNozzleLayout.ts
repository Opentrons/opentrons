import type { NozzleConfigurationParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

interface ConfigureNozzleLayoutParams {
  pipetteId: string
  configurationParams: NozzleConfigurationParams
}

export function forConfigureNozzleLayout(
  params: ConfigureNozzleLayoutParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, configurationParams } = params
  const { robotState } = robotStateAndWarnings
  const { style, primaryNozzle, backLeftNozzle } = configurationParams

  robotState.pipettes[pipetteId].nozzles = style
  robotState.pipettes[pipetteId].primaryNozzle = primaryNozzle
  robotState.pipettes[pipetteId].backLeftNozzle = backLeftNozzle
}
