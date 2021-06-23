import { MouseEvent } from 'react'

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

// TODO(CE): can we get rid of this? It does not seem to be used.
export type RectEvent = (event: MouseEvent, rect: GenericRect) => unknown
