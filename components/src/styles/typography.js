// @flow

import { css } from 'styled-components'

import { C_DARK_GRAY, C_FONT_LIGHT } from './colors'
import { FS_HEADER, FS_BODY_1 } from './font-size'
import { FW_SEMIBOLD, FW_REGULAR } from './font-weight'

export const FONT_HEADER_DARK = css`
  ${FS_HEADER}
  ${FW_SEMIBOLD}
  color: ${C_DARK_GRAY};
`

export const FONT_BODY_1_DARK = css`
  ${FS_BODY_1}
  ${FW_REGULAR}
  color: ${C_DARK_GRAY};
`

export const FONT_BODY_1_LIGHT = css`
  ${FS_BODY_1}
  ${FW_REGULAR}
  color: ${C_FONT_LIGHT};
`
