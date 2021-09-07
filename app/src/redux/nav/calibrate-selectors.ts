// calibrate sublocations
import { createSelector } from 'reselect'

import { LEFT, RIGHT } from '../pipettes'
import { selectors as RobotSelectors } from '../robot'
import { getCalibrateLocation } from './selectors'

import type { State } from '../types'
import type { SubnavLocation } from './types'
import type { Labware } from '../robot/types'
import type { Mount } from '../pipettes/types'

// TODO(mc, 2019-12-10): i18n
const NO_PIPETTE_SPECIFIED_FOR_THIS_MOUNT =
  'No pipette specified for this mount'
const PIPETTE_IS_NOT_USED_IN_THIS_PROTOCOL =
  'This pipette is not used in this protocol'

interface PerTiprackSubnav {
  default: SubnavLocation
  [key: string]: SubnavLocation
}

export const getCalibratePipettesLocations: (
  state: State
) => {
  left: PerTiprackSubnav
  right: PerTiprackSubnav
} = createSelector(
  getCalibrateLocation,
  RobotSelectors.getPipettes,
  RobotSelectors.getTipracksByMount,
  (parentLocation, pipettes, tipracksByMount) => {
    const makePathForMount = (mount: Mount): string =>
      `${parentLocation.path}/pipettes/${mount}`
    const makePathForMountTiprackCombo = (
      mount: Mount,
      definitionHash: string
    ): string => `${makePathForMount(mount)}/${definitionHash}`
    const makeDisReason = (mount: Mount): string | null => {
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

    const disReasons: { [mount in Mount]: string | null } = {
      left: makeDisReason('left'),
      right: makeDisReason('right'),
    }

    const buildTiprackPathsForMount = (
      mount: Mount,
      tipracks: Labware[]
    ): { [hash: string]: SubnavLocation } => {
      const hashes: string[] = tipracks
        .map(tr => tr.definitionHash)
        .filter<string>((tr): tr is string => Boolean(tr))
      return hashes.reduce<{ [hash: string]: SubnavLocation }>(
        (pathMap, hash) => {
          pathMap[hash] = {
            path: makePathForMountTiprackCombo(mount, hash),
            disabledReason: disReasons[mount],
          }
          return pathMap
        },
        {}
      )
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
