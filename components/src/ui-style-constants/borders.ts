import { css } from 'styled-components'
import { spacing1 } from './spacing'
import { blue } from './colors'

export const radiusSoftCorners = '3px'
export const radiusRoundEdge = '20px'
export const styleSolid = 'solid'

export const tabBorder = css`
  border-bottom-style: ${styleSolid};
  border-bottom-width: ${spacing1};
  border-bottom-color: ${blue};
`
