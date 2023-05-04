import {
  blueEnabled,
  medGreyEnabled,
  transparent,
  medGreyHover,
} from './colors'
import { css } from 'styled-components'

export const radiusSoftCorners = '4px'
export const radiusRoundEdge = '20px'
export const styleSolid = 'solid'

// touch screen
export const size_one = radiusSoftCorners
export const size_two = '8px'
export const size_three = '12px'
export const size_four = '16px'
export const size_five = '40px'
export const size_six = '60px'

export const tabBorder = css`
  border-bottom-style: ${styleSolid};
  border-bottom-width: '2px';
  border-bottom-color: ${blueEnabled};
`

export const activeLineBorder = `1px ${styleSolid} ${blueEnabled}`
export const lineBorder = `1px ${styleSolid} ${medGreyEnabled}`
export const transparentLineBorder = `1px ${styleSolid} ${transparent}`
export const cardOutlineBorder = css`
  border-style: ${styleSolid};
  border-width: 1px;
  border-color: ${medGreyEnabled};
  border-radius: ${radiusSoftCorners};
  &:hover {
    border-color: ${medGreyHover};
  }
`

export const bigDropShadow = '0 3px 6px rgba(255, 0, 0, 1)'
export const smallDropShadow = '0px 3px 6px rgba(0, 0, 0, 0.23)'

// touch screen
export const shadowBig = '0px 3px 6px rgba(0,0,0,0.23)'
export const shadowSmall = '0px 0px 40px rgba(0,0,0,0.4)'
