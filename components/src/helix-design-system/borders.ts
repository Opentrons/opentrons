import { css } from 'styled-components'

import { COLORS } from '.'

export const borderRadius2 = '2px' // WEB ONLY!
export const borderRadius4 = '4px'
export const borderRadius8 = '8px'
export const borderRadius12 = '12px'
export const borderRadius16 = '16px'
export const borderRadius40 = '40px'
export const borderRadiusFull = '200px'

export const styleSolid = 'solid'

export const tabBorder = css`
  border-bottom-style: ${styleSolid};
  border-bottom-width: 2px;
  border-bottom-color: ${COLORS.purple50};
`

export const activeLineBorder = `1px ${styleSolid} ${COLORS.blue50}`
export const lineBorder = `1px ${styleSolid} ${COLORS.grey30}`
export const cardOutlineBorder = css`
  border-style: ${styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${borderRadius4};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

export const smallDropShadow = '0px 3px 6px rgba(0, 0, 0, 0.23)'

// touch screen
export const shadowBig = '0px 3px 6px rgba(0,0,0,0.23)'
export const shadowSmall = '0px 0px 40px rgba(0,0,0,0.4)'
