import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import type { CutoutConfig, LabwareDefinition2 } from '@opentrons/shared-data'
import type { BlowOutLocation } from '../types'

export const convertBlowoutLocation = (
  location: string | undefined,
  dropTipLocation: CutoutConfig | LabwareDefinition2
): BlowOutLocation | undefined => {
  if (location == null) return undefined

  switch (location) {
    case 'source':
      return SOURCE_WELL_BLOWOUT_DESTINATION
    case 'destination':
      return DEST_WELL_BLOWOUT_DESTINATION
    case 'trash':
      return 'cutoutId' in dropTipLocation
        ? (dropTipLocation as CutoutConfig)
        : {
            cutoutId: 'cutoutA3',
            cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          }
    default:
      return undefined
  }
}
