// @flow
// calibrate sublocations
import { createSelector } from 'reselect'

import { LEFT, RIGHT } from '../pipettes'
import { selectors as RobotSelectors } from '../robot'
import { getCalibrateLocation } from './selectors'

import type { State } from '../types'
import type { SubnavLocation } from './types'
import type { Labware } from '../robot/types'

// TODO(mc, 2019-12-10): i18n
const NO_PIPETTE_SPECIFIED_FOR_THIS_MOUNT =
  'No pipette specified for this mount'
const PIPETTE_IS_NOT_USED_IN_THIS_PROTOCOL =
  'This pipette is not used in this protocol'

type PerTiprackSubnav = {
  default: SubnavLocation,
  [string]: SubnavLocation,
}

export const getCalibratePipettesLocations: State => {|
  left: PerTiprackSubnav,
  right: PerTiprackSubnav,
|} = createSelector(
  getCalibrateLocation,
  RobotSelectors.getPipettes,
  RobotSelectors.getTipracksByMount,
  (parentLocation, pipettes, tipracksByMount) => {
    const makePathForMount = mount => `${parentLocation.path}/pipettes/${mount}`
    const makePathForMountTiprackCombo = (mount, definitionHash) =>
      `${makePathForMount(mount)}/${definitionHash}`
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

    const disReasons = {
      left: makeDisReason('left'),
      right: makeDisReason('right'),
    }

    const buildTiprackPathsForMount: (
      'left' | 'right',
      Array<Labware>
    ) => { [string]: SubnavLocation } = (mount, tipracks) => {
      const hashes: Array<string> = tipracks
        .map(tr => tr.definitionHash)
        .filter(Boolean)
      return hashes.reduce((pathMap, hash) => {
        pathMap[hash] = {
          path: makePathForMountTiprackCombo(mount, hash),
          disabledReason: disReasons[mount],
        }
        return pathMap
      }, {})
    }

    return {
      left: {
        ...buildTiprackPathsForMount('left', tipracksByMount.left),
        default: {
          path: makePathForMount(LEFT),
          disabledReason: disReasons.left,
        },
      },
      right: {
        ...buildTiprackPathsForMount('right', tipracksByMount.right),
        default: {
          path: makePathForMount(RIGHT),
          disabledReason: disReasons.right,
        },
      },
    }
  }
)
