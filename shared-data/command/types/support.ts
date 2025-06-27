type BaseWellOrigin = 'top' | 'bottom' | 'center'
export type WellOrigin = BaseWellOrigin | 'meniscus'
export interface WellOffset {
  x?: number
  y?: number
  z?: number
}
export interface WellLocation {
  origin?: WellOrigin
  offset?: WellOffset
}

export type DropTipWellOrigin = BaseWellOrigin | 'default'

export interface DropTipWellLocation {
  origin?: DropTipWellOrigin
  offset?: WellOffset
}
