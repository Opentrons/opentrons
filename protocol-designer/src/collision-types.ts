// @flow

export type DragRect = {|
  xStart: number,
  yStart: number,
  xDynamic: number,
  yDynamic: number,
|}

export type GenericRect = {|
  x0: number,
  x1: number,
  y0: number,
  y1: number,
|}

export type BoundingRect = {|
  x: number,
  y: number,
  width: number,
  height: number,
|}

export type RectEvent = (MouseEvent, GenericRect) => mixed
