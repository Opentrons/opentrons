import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

interface ConfigureNozzleLayoutParams {
  pipetteId: string
  configurationParams: {
    style: NozzleConfigurationStyle
    primaryNozzle?: PrimaryNozzleConfigurationStyle
  }
}

export function forConfigureNozzleLayout(
  params: ConfigureNozzleLayoutParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, configurationParams } = params
  const { robotState } = robotStateAndWarnings

  robotState.pipettes[pipetteId].nozzles = configurationParams.style
  robotState.pipettes[pipetteId].primaryNozzle =
    configurationParams.primaryNozzle
}
