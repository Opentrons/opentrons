import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { IconName, StyleProps } from '@opentrons/components'

interface PrimaryFloatingButtonProps extends StyleProps {
  buttonText: string
  iconName: IconName
  disabled?: boolean
}

export function PrimaryFloatingButton({
  buttonText,
  iconName,
  disabled = false,
  ...buttonProps
}: PrimaryFloatingButtonProps): JSX.Element {
  return (
    <Btn css={PRIMARY_FLOATING_STYLE} disabled={disabled} {...buttonProps}>
      <Icon
        size="0.75rem"
        name={iconName}
        color={COLORS.white}
        data-testid="PrimaryFloatingButton_Icon"
      />
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSizeP}
        lineHeight={TYPOGRAPHY.lineHeight20}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {buttonText}
      </LegacyStyledText>
    </Btn>
  )
}

const PRIMARY_FLOATING_STYLE = css`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_ROW};
  grid-gap: ${SPACING.spacing4};
  color: ${COLORS.white};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  border-radius: ${BORDERS.borderRadiusFull};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  background-color: ${COLORS.blue50};
  box-shadow: none;
  text-transform: ${TYPOGRAPHY.textTransformNone};
  &:hover,
  &:focus {
    background-color: ${COLORS.blue55};
    box-shadow: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }
  &:active {
    background-color: ${COLORS.blue60};
  }
  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
