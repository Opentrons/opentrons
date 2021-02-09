// @flow
// border style constants
import { C_LIGHT_GRAY, C_MED_GRAY } from './colors'

export const BORDER_WIDTH_DEFAULT = '1px'

export const BORDER_RADIUS_DEFAULT = '2px'

export const BORDER_STYLE_NONE = 'none'
export const BORDER_STYLE_SOLID = 'solid'

export const BORDER_SOLID_LIGHT = `${BORDER_WIDTH_DEFAULT} ${BORDER_STYLE_SOLID} ${C_LIGHT_GRAY}`
export const BORDER_SOLID_MEDIUM = `${BORDER_WIDTH_DEFAULT} ${BORDER_STYLE_SOLID} ${C_MED_GRAY}`

export const SHADOW_LIGHT =
  '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
