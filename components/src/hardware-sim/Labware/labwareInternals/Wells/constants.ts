import type { CSSProperties, MouseEvent } from 'react'

export const UNSELECTED: 'unselected' = 'unselected'

export interface HighlightedWellLabels {
  wells: string[]
  color?: string
}
export interface WellMouseEvent {
  wellName: string
  event: MouseEvent
}

type WellName = string
export type WellStroke = CSSProperties['stroke']
export type WellFill = CSSProperties['fill']
export type WellFillByName = Record<WellName, WellFill>
export type WellStrokeByName = Record<WellName, WellStroke>

// Use this like a Set!
export type WellGroup = Record<string, null>

export const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const
