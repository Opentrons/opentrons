import type { TipState } from '@opentrons/step-generation'
import type { TipType } from '../types'

export const DEFAULT_TIP_SIZE = '20'

export const NEW: 'new' = 'new'
export const USED: 'used' = 'used'
export const SELECTED: 'selected' = 'selected'
export const NO: 'no' = 'no'
export const INACCESSIBLE: 'inaccessible' = 'inaccessible'
export const SELECTED_USED: 'selected_used' = 'selected_used'
export const SELECTED_ERROR: 'selected_error' = 'selected_error'

export const tipStateToTipType: Record<TipState, TipType> = {
  CLEAN: NEW,
  DIRTY: USED,
  EMPTY: NO,
}
