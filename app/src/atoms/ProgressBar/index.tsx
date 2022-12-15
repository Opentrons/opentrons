import * as React from 'react'
import { css } from 'styled-components'

import { COLORS, Box } from '@opentrons/components'

interface ProgressBarProps {
  /** the completed progress the range 0-100  */
  percentComplete: number
  /** optional liner progress's background the color default color is white */
  bgColor?: string
  /** optional liner progress's height the default height is 0.5rem(8px) */
  height?: string
  /** optional liner progress bar color the default color is blueEnabled */
  color?: string
  /** optional liner progress bar radius the default is 0 */
  borderRadius?: string
  /** optional the default is ease-in-out  */
  animationStyle?: string
}

export function ProgressBar({
  percentComplete,
  bgColor = COLORS.white,
  height = '0.5rem',
  color = COLORS.blueEnabled,
  borderRadius = '0',
  animationStyle = 'ease-in-out',
}: ProgressBarProps): JSX.Element {
  const ratio = percentComplete / 100
  const progress = ratio > 1 ? '100%' : `${String(ratio * 100)}%`

  const LINER_PROGRESS_CONTAINER_STYLE = css`
    height: ${height};
    background: ${bgColor};
    padding: 0;
    width: 100%;
    margin: 0;
    overflow: hidden;
    border-radius: ${borderRadius};
  `

  const LINER_PROGRESS_FILLER_STYLE = css`
    height: ${height};
    width: ${progress};
    background: ${color};
    transition: ${progress} 1s ${animationStyle};
    display: flex;
    align-items: center;
    justify-content: right;
    border-radius: inherit;
  `

  return (
    <Box
      role="progressbar"
      css={LINER_PROGRESS_CONTAINER_STYLE}
      data-testid="ProgressBar_Container"
    >
      <Box
        css={LINER_PROGRESS_FILLER_STYLE}
        data-testid="ProgressBar_Bar"
      ></Box>
    </Box>
  )
}
