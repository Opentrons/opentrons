// @flow
// calibrate sublocations
import { createSelector } from 'reselect'

import { LEFT, RIGHT } from '../pipettes'
import { selectors as RobotSelectors } from '../robot'
import type { State } from '../types'
import { getCalibrateLocation } from './selectors'
import type { SubnavLocation } from './types'

// TODO(mc, 2019-12-10): i18n
const NO_PIPETTE_SPECIFIED_FOR_THIS_MOUNT =
  'No pipette specified for this mount'
const PIPETTE_IS_NOT_USED_IN_THIS_PROTOCOL =
  'This pipette is not used in this protocol'

export const getCalibratePipettesLocations: State => {|
  left: SubnavLocation,
  right: SubnavLocation,
|} = createSelector(
  getCalibrateLocation,
  RobotSelectors.getPipettes,
  (parentLocation, pipettes) => {
    const makePath = mount => `${parentLocation.path}/pipettes/${mount}`
    const makeDisReason = mount => {
      const pipette = pipettes.find(p => p.mount === mount)
      let disabledReason = null

      if (parentLocation.disabledReason != null) {
        disabledReason = parentLocation.disabledReason
      } else if (!pipette) {
        disabledReason = NO_PIPETTE_SPECIFIED_FOR_THIS_MOUNT
      } else if (pipette.tipRacks.length === 0) {
        disabledReason = PIPETTE_IS_NOT_USED_IN_THIS_PROTOCOL
      }

      return disabledReason
    }

    return {
      left: { path: makePath(LEFT), disabledReason: makeDisReason(LEFT) },
      right: { path: makePath(RIGHT), disabledReason: makeDisReason(RIGHT) },
    }
  }
)
