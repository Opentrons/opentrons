import * as React from 'react'
import { css } from 'styled-components'

import {
  Flex,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../text'

import type { StyleProps } from '@opentrons/components'

export interface SnackbarProps extends StyleProps {
  message: string
  onClose?: () => void
  duration?: number
}

const SNACKBAR_ANIMATION_DURATION = 500

const OPEN_STYLE = css`
  animation-duration: ${SNACKBAR_ANIMATION_DURATION}ms;
  animation-name: fadein;
  overflow: hidden;

  @keyframes fadein {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`

export function Snackbar(props: SnackbarProps): JSX.Element {
  const { message, onClose, duration = 4000, ...styleProps } = props

  setTimeout(() => {
    onClose?.()
  }, duration)

  return (
    <Flex
      css={OPEN_STYLE}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.borderRadiusSize3}
      boxShadow={BORDERS.shadowSmall}
      backgroundColor={COLORS.darkBlack100}
      maxWidth="max-content"
      padding={`${SPACING.spacing20} ${SPACING.spacing24}`}
      data-testid="Snackbar"
      {...styleProps}
    >
      <StyledText
        color={COLORS.white}
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={TYPOGRAPHY.lineHeight28}
      >
        {message}
      </StyledText>
    </Flex>
  )
}
