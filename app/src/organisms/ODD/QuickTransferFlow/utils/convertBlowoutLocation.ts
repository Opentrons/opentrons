import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import type { CutoutConfig } from '@opentrons/shared-data'
import type { BlowOutLocation } from '../types'

export const convertBlowoutLocation = (
  location: string | undefined,
  dropTipLocation: CutoutConfig | string
): BlowOutLocation | undefined => {
  if (location == null) return undefined

  switch (location) {
    case 'source':
      return SOURCE_WELL_BLOWOUT_DESTINATION
    case 'destination':
      return DEST_WELL_BLOWOUT_DESTINATION
    case 'trash':
      return typeof dropTipLocation !== 'string' &&
        'cutoutId' in dropTipLocation
        ? dropTipLocation
        : {
            cutoutId: 'cutoutA3',
            cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          }
    default:
      return undefined
  }
}
