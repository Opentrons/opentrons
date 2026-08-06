import { COLUMN, ROW, SINGLE } from '@opentrons/shared-data'

import type { NozzleConfigurationStyle } from '@opentrons/shared-data'

export const getChannels = (
  channels: number | null,
  nozzles?: NozzleConfigurationStyle
): number => {
  let numChannels = channels ?? 1
  if (nozzles === SINGLE) {
    numChannels = 1
  } else if (nozzles === COLUMN) {
    numChannels = 8
  } else if (nozzles === ROW) {
    numChannels = 12
  }
  return numChannels
}
