import { css } from 'styled-components'
import { COLORS } from '../helix-design-system'

export const radiusSoftCorners = '4px'
export const radiusRoundEdge = '20px'
export const styleSolid = 'solid'

// touch screen
export const borderRadiusSize1 = radiusSoftCorners
export const borderRadiusSize2 = '8px'
export const borderRadiusSize3 = '12px'
export const borderRadiusSize4 = '16px'
export const borderRadiusSize5 = '40px'
export const borderRadiusSize6 = '60px'

export const tabBorder = css`
  border-bottom-style: ${styleSolid};
  border-bottom-width: 2px;
  border-bottom-color: ${COLORS.blue50};
`

export const activeLineBorder = `1px ${styleSolid} ${COLORS.blue50}`
export const lineBorder = `1px ${styleSolid} ${COLORS.grey30}`
export const transparentLineBorder = `1px ${styleSolid} ${COLORS.transparent}`
export const cardOutlineBorder = css`
  border-style: ${styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${radiusSoftCorners};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

export const bigDropShadow = '0 3px 6px rgba(255, 0, 0, 1)'
export const smallDropShadow = '0px 3px 6px rgba(0, 0, 0, 0.23)'

// touch screen
export const shadowBig = '0px 3px 6px rgba(0,0,0,0.23)'
export const shadowSmall = '0px 0px 40px rgba(0,0,0,0.4)'
