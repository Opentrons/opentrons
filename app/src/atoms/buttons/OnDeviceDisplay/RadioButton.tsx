import * as React from 'react'
import styled, { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  Flex,
} from '@opentrons/components'
import { StyledText } from '../../text'

import type { StyleProps } from '@opentrons/components'

interface RadioButtonProps extends StyleProps {
  buttonLabel: string
  buttonValue: string | number
  onClick: () => void
  disabled?: boolean
  isSelected?: boolean
  size?: 'large' | 'small'
}

export function RadioButton(props: RadioButtonProps): JSX.Element {
  const {
    buttonLabel,
    buttonValue,
    disabled = false,
    isSelected = false,
    onClick,
    size,
  } = props

  const isLarge = size === 'large'

  const SettingButton = styled.input`
    display: none;
  `

  const availableButtonStyles = css`
    background: ${COLORS.foundationalBlue};

    &:active {
      background-color: #94afd4;
    }
  `

  const selectedButtonStyles = css`
    background: ${COLORS.blueEnabled};
    color: ${COLORS.white};

    &:active {
      background-color: #045dd0;
    }
  `

  const disabledButtonStyles = css`
    background-color: ${COLORS.darkBlack_twenty};
    color: ${COLORS.darkBlack_sixty};
    cursor: not-allowed;
  `

  const SettingButtonLabel = styled.label`
    border-radius: ${BORDERS.size_four};
    cursor: pointer;
    padding: ${isLarge ? SPACING.spacing5 : SPACING.spacingM};
    width: 100%;

    ${isSelected ? selectedButtonStyles : availableButtonStyles}
    ${disabled && disabledButtonStyles}

    &:focus-visible {
      box-shadow: 0 0 0 ${SPACING.spacingS} ${COLORS.fundamentalsFocus};
    }
  `

  return (
    <Flex width="100%">
      <SettingButton
        checked={isSelected}
        disabled={disabled}
        id={buttonLabel}
        onChange={onClick}
        type="radio"
        value={buttonValue}
      />
      <SettingButtonLabel role="label" htmlFor={buttonLabel}>
        <StyledText
          fontSize={isLarge ? TYPOGRAPHY.fontSize28 : TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={
            isLarge ? TYPOGRAPHY.lineHeight36 : TYPOGRAPHY.lineHeight28
          }
        >
          {buttonLabel}
        </StyledText>
      </SettingButtonLabel>
    </Flex>
  )
}
