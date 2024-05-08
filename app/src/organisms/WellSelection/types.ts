export interface DragRect {
  xStart: number
  yStart: number
  xDynamic: number
  yDynamic: number
}

export interface GenericRect {
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface BoundingRect {
  x: number
  y: number
  width: number
  height: number
}

export interface LocationLiquidState {
  [ingredGroup: string]: { volume: number }
}

export interface WellContents {
  // eg 'A1', 'A2' etc
  wellName?: string
  groupIds: string[]
  ingreds: LocationLiquidState
  highlighted?: boolean
  selected?: boolean
  maxVolume?: number
}
export type ContentsByWell = {
  [wellName: string]: WellContents
} | null

export const COLUMN = 'COLUMN'
const SINGLE = 'SINGLE'
const ROW = 'ROW'
const QUADRANT = 'QUADRANT'
export const ALL = 'ALL'

export type NozzleConfigurationStyle =
  | typeof COLUMN
  | typeof SINGLE
  | typeof ROW
  | typeof QUADRANT
  | typeof ALL

export type NozzleType = NozzleConfigurationStyle | '8-channel'
