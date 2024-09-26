import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DISPLAY_FLEX,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'

interface SendButtonProps {
  handleClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function SendButton({
  handleClick,
  disabled = false,
  isLoading = false,
}: SendButtonProps): JSX.Element {
  const playButtonStyle = css`
    -webkit-tap-highlight-color: transparent;
    &:focus {
      background-color: ${COLORS.blue60};
      color: ${COLORS.white};
    }

    &:hover {
      background-color: ${COLORS.blue50};
      color: ${COLORS.white};
    }

    &:focus-visible {
      background-color: ${COLORS.blue50};
    }

    &:active {
      background-color: ${COLORS.blue60};
      color: ${COLORS.white};
    }

    &:disabled {
      background-color: ${COLORS.grey35};
      color: ${COLORS.grey50};
    }
  `
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={disabled ? COLORS.grey35 : COLORS.blue50}
      borderRadius={BORDERS.borderRadiusFull}
      display={DISPLAY_FLEX}
      justifyContent={JUSTIFY_CENTER}
      width="4.25rem"
      height="3.75rem"
      disabled={disabled || isLoading}
      onClick={handleClick}
      aria-label="play"
      css={playButtonStyle}
    >
      <Icon
        color={disabled ? COLORS.grey50 : COLORS.white}
        name={isLoading ? 'ot-spinner' : 'send'}
        spin={isLoading}
        size="2rem"
        data-testid={`SendButton_icon_${isLoading ? 'ot-spinner' : 'send'}`}
      />
    </Btn>
  )
}
