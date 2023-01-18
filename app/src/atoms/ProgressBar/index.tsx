import * as React from 'react'
import { css, FlattenInterpolation } from 'styled-components'

import { COLORS, Box } from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'

interface ProgressBarProps {
  /** the completed progress the range 0-100  */
  percentComplete: number
  outerStyleProps: FlattenSimpleInterpolation
  innerStyleProps: StyleProps
}

export function ProgressBar({
  percentComplete,
  outerStyleProps,
  innerStyleProps,
}: ProgressBarProps): JSX.Element {
  const ratio = percentComplete / 100
  const progress = ratio > 1 ? '100%' : `${String(ratio * 100)}%`

  const LINER_PROGRESS_CONTAINER_STYLE = css`
    height: 0.5rem;
    background: ${COLORS.white};
    padding: 0;
    width: 100%;
    margin: 0;
    overflow: hidden;
    border-radius: 0;
    ${outerStyleProps}
  `

  const LINER_PROGRESS_FILLER_STYLE = css`
    height: 0.5rem;
    width: ${progress};
    background: ${COLORS.blueEnabled};
    transition: ${progress} 1s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: right;
    border-radius: inherit;
    ${innerStyleProps}
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
