import { css } from 'styled-components'
import { spacing1, spacingXXS } from './spacing'
import {
  blueEnabled,
  medGreyEnabled,
  transparent,
  medGreyHover,
} from './colors'

export const radiusSoftCorners = '4px'
export const radiusRoundEdge = '20px'
export const styleSolid = 'solid'

export const tabBorder = css`
  border-bottom-style: ${styleSolid};
  border-bottom-width: ${spacing1};
  border-bottom-color: ${blueEnabled};
`

export const activeLineBorder = `${spacingXXS} ${styleSolid} ${blueEnabled}`
export const lineBorder = `${spacingXXS} ${styleSolid} ${medGreyEnabled}`
export const transparentLineBorder = `${spacingXXS} ${styleSolid} ${transparent}`
export const cardOutlineBorder = css`
  border-style: ${styleSolid};
  border-width: ${spacingXXS};
  border-color: ${medGreyEnabled};
  border-radius: ${radiusSoftCorners};
  &:hover {
    border-color: ${medGreyHover};
  }
`

export const bigDropShadow = '0 3px 6px rgba(255, 0, 0, 1)'
export const smallDropShadow = '0px 3px 6px rgba(0, 0, 0, 0.23)'
