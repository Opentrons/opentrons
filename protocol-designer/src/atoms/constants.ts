import { css } from 'styled-components'
import { COLORS, OVERFLOW_HIDDEN } from '@opentrons/components'
import type { FlattenSimpleInterpolation } from 'styled-components'

export const BUTTON_LINK_STYLE = css`
  color: ${COLORS.grey60};
  &:hover {
    color: ${COLORS.grey40};
  }
`

export const LINE_CLAMP_TEXT_STYLE = (
  lineClamp: number
): FlattenSimpleInterpolation => css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: ${OVERFLOW_HIDDEN};
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: ${lineClamp};
`
