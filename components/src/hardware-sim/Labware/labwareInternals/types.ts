import type { MouseEvent } from 'react'
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

export interface WellMouseEvent {
  wellName: string
  event: MouseEvent
}

// wellName to CSS color, eg {'A1': '#123456'}
export type WellFill = Record<string, string>
export type WellStroke = WellFill

// Use this like a Set!
export type WellGroup = Record<string, null>

export interface HighlightedWellLabels {
  wells: string[]
  color?: string
}

export type TipType =
  | typeof NEW
  | typeof USED
  | typeof SELECTED
  | typeof NO
  | typeof INACCESSIBLE
  | typeof SELECTED_USED
  | typeof SELECTED_ERROR

export type WellType = typeof SELECTED | typeof INACCESSIBLE | typeof UNSELECTED

export const WELL: 'well' = 'well'
export const TIP: 'tip' = 'tip'

export type SelectionType = typeof WELL | typeof TIP
