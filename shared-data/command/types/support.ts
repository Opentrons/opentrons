type BaseWellOrigin = 'top' | 'bottom' | 'center'
export type WellOrigin = BaseWellOrigin | 'meniscus'
export interface WellOffset {
  x?: number
  y?: number
  z?: number
}
// TODO(jh, 06-27-25): Origin and offset should be required. Mark them as so and fix all the type errors.
export interface WellLocation {
  origin?: WellOrigin
  offset?: WellOffset
}

export type DropTipWellOrigin = BaseWellOrigin | 'default'

export interface DropTipWellLocation {
  origin?: DropTipWellOrigin
  offset?: WellOffset
}
