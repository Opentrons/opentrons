import * as React from 'react'

export type WellMouseEvent = {
  wellName: string,
  event: React.MouseEvent,
}

// wellName to CSS color, eg {'A1': '#123456'}
export type WellFill = { [wellName: string]: string, ... }

// Use this like a Set!
export type WellGroup = { [wellName: string]: null, ... }
