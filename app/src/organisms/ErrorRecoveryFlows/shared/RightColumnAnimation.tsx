import { css } from 'styled-components'

import {
  AnimationVideo,
  RESPONSIVENESS,
} from '@opentrons/components'

import type { JSX } from 'react'

interface RightColumnAnimationsProps {
  animationSrc: string
}

export function RightColumnAnimation(
  props: RightColumnAnimationsProps
): JSX.Element {
  const { animationSrc } = props

  return (
    <AnimationVideo role="presentation" css={ANIMATION_STYLE}>
      <source src={animationSrc} data-testid="animation" />
    </AnimationVideo>
  )
}

const ANIMATION_STYLE = css`
  width: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 27rem;
    height: 20.25rem;
  }
`
