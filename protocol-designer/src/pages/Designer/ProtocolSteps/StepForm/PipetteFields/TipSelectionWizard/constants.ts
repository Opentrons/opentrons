import { NEW, NO, USED } from '@opentrons/components'

import type { TipType } from '@opentrons/components'
import type { TipState } from '@opentrons/step-generation'

export const TIP_STATE_TO_TIP_TYPE: Record<TipState, TipType> = {
  CLEAN: NEW,
  DIRTY: USED,
  EMPTY: NO,
}
