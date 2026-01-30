import type { MouseEvent } from 'react'

export const UNSELECTED: 'unselected' = 'unselected'

export interface HighlightedWellLabels {
  wells: string[]
  color?: string
}
export interface WellMouseEvent {
  wellName: string
  event: MouseEvent
}

// wellName to CSS color, eg {'A1': '#123456'}
export type WellFill = Record<string, string>
export type WellStroke = WellFill

// Use this like a Set!
export type WellGroup = Record<string, null>

export const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const
