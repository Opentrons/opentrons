// @flow
import {
  getWellTotalVolume,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import { getLocationTotalVolume } from '../utils/misc'
import { wellOverflow } from '../warningCreators'

import type { CommandCreatorWarning, LocationLiquidState } from '../types'

// Given a liquid state after dispense/blowout has happened,
// return array of errors (or empty array).
export const _getOverflowWarnings = (
  liquidState: { [well: string]: LocationLiquidState, ... },
  wellsForTips: Array<string>,
  labwareDef: LabwareDefinition2
): Array<CommandCreatorWarning> => {
  const isOverflowing = wellsForTips.some(well => {
    const wellLiquidVolume = getLocationTotalVolume(liquidState[well])
    const wellCapacity = getWellTotalVolume(labwareDef, well)

    if (wellCapacity == null) {
      // Don't show an overflow if somehow the well has no capacity
      // This should never happen
      return false
    }

    return wellLiquidVolume > wellCapacity
  })
  return isOverflowing ? [wellOverflow()] : []
}
