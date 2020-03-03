// @flow

import { css } from 'styled-components'

import { C_FONT_DARK } from './colors'
import { FS_HEADER } from './font-size'
import { FW_SEMIBOLD } from './font-weight'

export const FONT_HEADER_DARK = css`
  ${FS_HEADER};
  ${FW_SEMIBOLD}
  color: ${C_FONT_DARK};
`
