import type {
  INACCESSIBLE,
  NEW,
  NO,
  SELECTED,
  SELECTED_ERROR,
  SELECTED_USED,
  USED,
} from './Tips/constants'
import type { UNSELECTED } from './Wells/constants'

export type TipType =
  | typeof NEW
  | typeof USED
  | typeof SELECTED
  | typeof NO
  | typeof INACCESSIBLE
  | typeof SELECTED_USED
  | typeof SELECTED_ERROR

export const WELL: 'well' = 'well'
export const TIP: 'tip' = 'tip'

export type WellType =
  | typeof SELECTED
  | typeof INACCESSIBLE
  | typeof UNSELECTED
  | typeof SELECTED_ERROR
export type SelectionType = typeof WELL | typeof TIP
