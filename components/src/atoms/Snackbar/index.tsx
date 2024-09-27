import { useState } from 'react'
import { css } from 'styled-components'
import { ALIGN_CENTER } from '../../styles'
import { Flex } from '../../primitives'
import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING } from '../../ui-style-constants'
import { StyledText } from '../StyledText'

import type { StyleProps } from '../../primitives'

export interface SnackbarProps extends StyleProps {
  message: string
  onClose?: () => void
  duration?: number
}

const SNACKBAR_ANIMATION_DURATION = 500

const ODD_ANIMATION_OPTIMIZATIONS = `
  backface-visibility: hidden;
  perspective: 1000;
  will-change: opacity;
  `

const OPEN_STYLE = css`
  animation-duration: ${SNACKBAR_ANIMATION_DURATION}ms;
  animation-name: fadein;
  overflow: hidden;
  ${ODD_ANIMATION_OPTIMIZATIONS}

  @keyframes fadein {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`

const CLOSE_STYLE = css`
  animation-duration: ${SNACKBAR_ANIMATION_DURATION}ms;
  animation-name: fadeout;
  overflow: hidden;
  ${ODD_ANIMATION_OPTIMIZATIONS}

  @keyframes fadeout {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`

export function Snackbar(props: SnackbarProps): JSX.Element {
  const { message, onClose, duration = 4000, ...styleProps } = props
  const [isClosed, setIsClosed] = useState<boolean>(false)

  const animationStyle = isClosed ? CLOSE_STYLE : OPEN_STYLE

  setTimeout(() => {
    setIsClosed(true)
    setTimeout(() => {
      onClose?.()
    }, SNACKBAR_ANIMATION_DURATION - 50)
  }, duration)

  return (
    <Flex
      css={animationStyle}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.borderRadius8}
      boxShadow={BORDERS.shadowSmall}
      backgroundColor={COLORS.black90}
      maxWidth="max-content"
      padding={`${SPACING.spacing20} ${SPACING.spacing24}`}
      data-testid="Snackbar"
      color={COLORS.white}
      {...styleProps}
    >
      <StyledText
        oddStyle="bodyTextSemiBold"
        desktopStyle="bodyDefaultSemiBold"
      >
        {message}
      </StyledText>
    </Flex>
  )
}
