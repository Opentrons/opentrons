import * as React from 'react'
import { Btn, StyledText, COLORS, RESPONSIVENESS } from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'
import { css } from 'styled-components'

const GO_BACK_BUTTON_STYLE = css`
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    &:hover {
      opacity: 100%;
    }
    &:active {
      opacity: 70%;
    }
  }
`

const GO_BACK_BUTTON_DISABLED_STYLE = css`
  color: ${COLORS.grey60};
`

interface TextOnlyButtonProps extends StyleProps {
  onClick: () => void
  buttonText: React.ReactNode
  disabled?: boolean
}

export function TextOnlyButton({
  onClick,
  buttonText,
  disabled = false,
  ...styleProps
}: TextOnlyButtonProps): JSX.Element {
  return (
    <Btn onClick={onClick} disabled={disabled} {...styleProps}>
      <StyledText
        desktopStyle="bodyDefaultSemiBold"
        oddStyle="bodyTextSemiBold"
        css={disabled ? GO_BACK_BUTTON_DISABLED_STYLE : GO_BACK_BUTTON_STYLE}
      >
        {buttonText}
      </StyledText>
    </Btn>
  )
}
