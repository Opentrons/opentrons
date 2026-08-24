import { useEffect, useState } from 'react'
import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { ALIGN_CENTER } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { StyledText } from '../StyledText'

import type { ReactNode } from 'react'
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

export function Snackbar(props: SnackbarProps): ReactNode {
  const { message, onClose, duration = 4000, ...styleProps } = props
  const [isClosed, setIsClosed] = useState<boolean>(false)

  const animationStyle = isClosed ? CLOSE_STYLE : OPEN_STYLE

  // Manages the snackbar closing sequencing
  useEffect(() => {
    if (duration == null || duration === 0) return

    const closeTimer = setTimeout(() => {
      // Trigger the closing animation
      setIsClosed(true)

      // Call onClose after animation completes, if it exists
      onClose != null && setTimeout(onClose, SNACKBAR_ANIMATION_DURATION - 50)
    }, duration)

    return () => {
      clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  return (
    <Flex css={animationStyle} data-testid="Snackbar" {...styleProps}>
      <StyledText
        oddStyle="bodyTextSemiBold"
        desktopStyle="bodyDefaultSemiBold"
      >
        {message}
      </StyledText>
    </Flex>
  )
}

const COMMON_STYLE = css`
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: ${BORDERS.shadowSmall};
  background-color: ${COLORS.black90};
  max-width: max-content;
  padding: ${SPACING.spacing20} ${SPACING.spacing24};
  color: ${COLORS.white};
`

const OPEN_STYLE = css`
  ${COMMON_STYLE}
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
  ${COMMON_STYLE}
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
