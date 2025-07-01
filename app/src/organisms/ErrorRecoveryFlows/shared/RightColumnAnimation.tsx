import { css } from 'styled-components'

import {
  AnimationVideo,
  Flex,
  JUSTIFY_CENTER,
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
    <Flex css={ANIMATION_CONTAINER_STYLE}>
      <AnimationVideo role="presentation" css={ANIMATION_STYLE}>
        <source src={animationSrc} data-testid="animation" />
      </AnimationVideo>
    </Flex>
  )
}

const ANIMATION_CONTAINER_STYLE = css`
  justify-content: ${JUSTIFY_CENTER};
  overflow: hidden;
  max-height: 13.25rem;
`

const ANIMATION_STYLE = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 27rem;
    height: 20.25rem;
  }
`
