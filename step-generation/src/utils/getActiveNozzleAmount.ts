import {
  ALL,
  COLUMN,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  QUADRANT,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import type {
  ActiveNozzleNumber,
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'

export interface ActiveNozzleAmountProps {
  nozzles: NozzleConfigurationStyle | undefined
  pipetteSpec: PipetteV2Specs
  primaryNozzle: PrimaryNozzleConfigurationStyle | undefined
  backLeftNozzle?: PrimaryNozzleConfigurationStyle
}

export const getActiveNozzleAmount = (
  props: ActiveNozzleAmountProps
): ActiveNozzleNumber => {
  const { nozzles, pipetteSpec, primaryNozzle, backLeftNozzle } = props
  const pipetteChannels: ActiveNozzleNumber = pipetteSpec.channels
  if (nozzles == null) {
    return pipetteChannels
  }
  switch (nozzles) {
    case ROW:
      return 12
    case COLUMN:
      return 8
    case SINGLE:
      return 1
    case ALL:
      return pipetteChannels
    case PARTIAL_COLUMN:
      return PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    case QUADRANT:
      return backLeftNozzle != null
        ? PARTIAL_NOZZLE_MAP[backLeftNozzle as PartialPrimaryNozzles]
        : pipetteChannels
    default:
      return pipetteChannels
  }
}
