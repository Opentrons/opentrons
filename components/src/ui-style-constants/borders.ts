import { css } from 'styled-components'
import { COLORS, BORDERS } from '../helix-design-system'

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
  border-radius: ${BORDERS.borderRadius4};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

export const smallDropShadow = '0px 3px 6px rgba(0, 0, 0, 0.23)'

// touch screen
export const shadowBig = '0px 3px 6px rgba(0,0,0,0.23)'
export const shadowSmall = '0px 0px 40px rgba(0,0,0,0.4)'
