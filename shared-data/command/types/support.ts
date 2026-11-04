import type {
  WELL_ORIGIN_BOTTOM,
  WELL_ORIGIN_CENTER,
  WELL_ORIGIN_MENISCUS,
  WELL_ORIGIN_TOP,
} from '../../js/constants'

type BaseWellOrigin =
  typeof WELL_ORIGIN_TOP | typeof WELL_ORIGIN_BOTTOM | typeof WELL_ORIGIN_CENTER

export type WellOrigin = BaseWellOrigin | typeof WELL_ORIGIN_MENISCUS
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

export interface KnownWellOffset {
  x: number
  y: number
  z: number
}
export interface KnownWellLocation {
  origin: WellOrigin
  offset: WellOffset
}
export type DropTipWellOrigin = BaseWellOrigin | 'default'

export interface DropTipWellLocation {
  origin?: DropTipWellOrigin
  offset?: WellOffset
}
