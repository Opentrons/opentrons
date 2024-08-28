import * as React from 'react'
import styled, { css } from 'styled-components'
import {
  BORDERS,
  COLORS,
  Flex,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

interface RadioButtonProps extends StyleProps {
  buttonLabel: string
  buttonValue: string | number
  onChange: React.ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  isSelected?: boolean
  radioButtonType?: 'large' | 'small'
  subButtonLabel?: string
  id?: string
  maxLines?: number | null
}

export function RadioButton(props: RadioButtonProps): JSX.Element {
  const {
    buttonLabel,
    buttonValue,
    disabled = false,
    isSelected = false,
    onChange,
    radioButtonType = 'large',
    subButtonLabel,
    id = buttonLabel,
    maxLines = null,
  } = props

  const isLarge = radioButtonType === 'large'

  const SettingButton = styled.input`
    display: none;
  `

  const AVAILABLE_BUTTON_STYLE = css`
    background: ${COLORS.blue35};

    &:active {
      background-color: ${COLORS.blue40};
    }
  `

  const SELECTED_BUTTON_STYLE = css`
    background: ${COLORS.blue50};
    color: ${COLORS.white};

    &:active {
      background-color: ${COLORS.blue60};
    }
  `

  const DISABLED_BUTTON_STYLE = css`
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};
    cursor: not-allowed;
  `

  // TODO: (ew, 2023-04-21): button is not tabbable, so focus state
  // is not possible on ODD. It's testable in storybook but not in real life.
  const SettingButtonLabel = styled.label`
      border-radius: ${BORDERS.borderRadius16};
      cursor: pointer;
      padding: ${isLarge ? SPACING.spacing24 : SPACING.spacing20};
      width: 100%;

      ${isSelected ? SELECTED_BUTTON_STYLE : AVAILABLE_BUTTON_STYLE}
      ${disabled && DISABLED_BUTTON_STYLE}

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        cursor: default;
        display: ${maxLines != null ? '-webkit-box' : undefined};
        -webkit-line-clamp: ${maxLines ?? undefined};
        -webkit-box-orient: ${maxLines != null ? 'vertical' : undefined};
        word-wrap: break-word;
      }
    }
  `

  return (
    <Flex width="100%">
      <SettingButton
        checked={isSelected}
        disabled={disabled}
        id={id}
        onChange={onChange}
        type="radio"
        value={buttonValue}
      />
      <SettingButtonLabel role="label" htmlFor={id}>
        <StyledText
          oddStyle={isLarge ? 'level4HeaderSemiBold' : 'bodyTextRegular'}
          desktopStyle="bodyDefaultRegular"
        >
          {buttonLabel}
        </StyledText>
        {subButtonLabel != null ? (
          <StyledText
            oddStyle="level4HeaderRegular"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {subButtonLabel}
          </StyledText>
        ) : null}
      </SettingButtonLabel>
    </Flex>
  )
}
