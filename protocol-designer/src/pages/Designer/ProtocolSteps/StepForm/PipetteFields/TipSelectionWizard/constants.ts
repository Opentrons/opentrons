import { NEW, NO, USED } from '@opentrons/components'

import type { TipType } from '@opentrons/components'
import type { TipState } from '@opentrons/step-generation'

export const TIP_STATE_TO_TIP_TYPE: Record<TipState, TipType> = {
  CLEAN: NEW,
  DIRTY: USED,
  EMPTY: NO,
}

export const LABEL_PLACEMENT_TOP: 'top' = 'top'
export const LABEL_PLACEMENT_BOTTOM: 'bottom' = 'bottom'
export const LABEL_PLACEMENT_LEFT: 'left' = 'left'
export const LABEL_PLACEMENT_RIGHT: 'right' = 'right'

export const LABEL_BORDER_WIDTH_PX = 1
