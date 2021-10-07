import * as React from 'react'

export interface WellMouseEvent {
  wellName: string
  event: React.MouseEvent
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
