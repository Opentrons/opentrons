import { ALL, COLUMN, SINGLE } from '@opentrons/shared-data'

import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'

const SINGLE_CHANNEL = 1
const NINETY_SIX_CHANNEL = 96

export const getNozzleConfig = (
  nozzles: NozzleConfigurationStyle | undefined,
  pipetteSpec: PipetteV2Specs
): NozzleConfigurationStyle => {
  if (nozzles != null) return nozzles
  if (pipetteSpec.channels === SINGLE_CHANNEL) return SINGLE
  if (pipetteSpec.channels === NINETY_SIX_CHANNEL) return ALL
  return COLUMN
}
