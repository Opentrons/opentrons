import type { NozzleConfigurationStyle } from '@opentrons/shared-data'
import type { RobotStateAndWarnings } from '../types'

interface ConfigureNozzleLayoutParams {
  pipetteId: string
  configurationParams: {
    style: NozzleConfigurationStyle
    primaryNozzle?: string
  }
}

export function forConfigureNozzleLayout(
  params: ConfigureNozzleLayoutParams,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, configurationParams } = params
  const { robotState } = robotStateAndWarnings

  robotState.pipettes[pipetteId].nozzles = configurationParams.style
}
