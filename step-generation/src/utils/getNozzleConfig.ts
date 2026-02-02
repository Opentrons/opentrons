import { ALL, COLUMN, SINGLE } from '@opentrons/shared-data'

import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'

export const getNozzleConfig = (
  nozzles: NozzleConfigurationStyle | undefined,
  pipetteSpec: PipetteV2Specs
): NozzleConfigurationStyle => {
  if (nozzles != null) {
    return nozzles
  }

  if (pipetteSpec.channels === 1) {
    return SINGLE
  }

  if (pipetteSpec.channels === 96) {
    return ALL
  }
  return COLUMN
}
