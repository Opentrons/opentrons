import * as React from 'react'
import { css } from 'styled-components'
import { BORDERS, Box, COLORS } from '@opentrons/components'

interface SkeletonProps {
  width: string
  height: string
  //  backgroundSize is the total width to add to every Skeleton in the component which controls the animation speed
  backgroundSize: string
  borderRadius?: string
}
export const Skeleton = (props: SkeletonProps): JSX.Element => {
  const { width, height, backgroundSize, borderRadius } = props
  const SKELETON_STYLE = css`
    border-radius: ${borderRadius ?? BORDERS.radiusSoftCorners};
    animation: shimmer 2s infinite linear;
    background: linear-gradient(
      to right,
      ${COLORS.medGreyEnabled} 1%,
      #e3e3e366 25%,
      ${COLORS.medGreyEnabled} 40%
    );
    background-size: ${backgroundSize};
    width: ${width};
    height: ${height};

    @keyframes shimmer {
      0% {
        background-position: -${backgroundSize} 0;
      }
      100% {
        background-position: ${backgroundSize} 0;
      }
    }
    @keyframes fullView {
      100% {
        width: 100%;
      }
    }
  `

  return <Box data-testid="Skeleton" css={SKELETON_STYLE} />
}
