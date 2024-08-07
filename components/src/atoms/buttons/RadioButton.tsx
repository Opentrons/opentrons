import * as React from 'react'
import styled, { css } from 'styled-components'
import { Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Icon,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '../..'
import type { IconName } from '../..'
import type { StyleProps } from '../../primitives'

interface RadioButtonProps extends StyleProps {
  buttonLabel: string
  buttonValue: string | number
  onChange: React.ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  isSelected?: boolean
  radioButtonType?: 'large' | 'small'
  subButtonLabel?: string
  id?: string
  iconName?: IconName
}

//  used for ODD and helix
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
    iconName,
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
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing2}
          alignItems={ALIGN_CENTER}
        >
          {iconName != null ? (
            <Icon name={iconName} width="1rem" height="1rem" />
          ) : null}
          <StyledText
            oddStyle={isLarge ? 'level4HeaderRegular' : 'bodyTextRegular'}
            desktopStyle="bodyDefaultRegular"
          >
            {buttonLabel}
          </StyledText>
        </Flex>
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
