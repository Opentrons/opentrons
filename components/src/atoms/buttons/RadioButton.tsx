import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_START,
  CURSOR_DEFAULT,
  CURSOR_NOT_ALLOWED,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  StyledText,
  Tag,
} from '../..'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ChangeEventHandler, MouseEventHandler, ReactNode } from 'react'
import type { IconName } from '../../icons'
import type { StyleProps } from '../../primitives'

export interface RadioButtonSubLabel {
  /* Optional subtext */
  label: ReactNode
  /* The alignment relative to the primary label. Defaults to horizontal if unspecified. */
  align?: 'horizontal' | 'vertical'
}

interface RadioButtonProps extends StyleProps {
  /** Radio button label */
  buttonLabel: string | ReactNode
  /** Radio button value */
  buttonValue: string | number
  /** Radio button onChange handler */
  onChange: ChangeEventHandler<HTMLInputElement>
  /** Radio button disabled state. This will be replaced with aria-disabled in the future. */
  disabled?: boolean
  /** Radio button icon name */
  iconName?: IconName
  /** Radio button tag text */
  tagText?: string
  /** Radio button isSelected state */
  isSelected?: boolean
  /** Radio button largeDesktopBorderRadius state */
  largeDesktopBorderRadius?: boolean
  /** Radio button radioButtonType state */
  radioButtonType?: 'large' | 'small'
  /**
   *  id is used for the special case in ODD where the screen has two radio buttons.
   *  The screen that uses this prop is CSV runtime parameter CSV file selection screen.
   *  Basically, this would not be used in desktop app/web app.
   */
  id?: string
  /** Radio button maxLines for label */
  maxLines?: number
  /** used for mouseEnter and mouseLeave */
  setNoHover?: () => void
  setHovered?: () => void
  // TODO wire up the error state for the radio button
  error?: string | null
  /** Radio button buttonSubLabel */
  buttonSubLabel?: RadioButtonSubLabel
  /** testid is used for testing */
  testid?: string
  /**
   * with the changes in UX and accessibility support, 'disabled' will eventually be replaced with 'aria-disabled' in the future.
   */
  ariaDisabled?: boolean
  /**
   *  onClick is needed for RadioButton since onChange requires actual selected value change.
   *  For this case, selected value change shouldn't be happened.
   */
  onClick?: MouseEventHandler
}

// used for ODD and helix
export function RadioButton(props: RadioButtonProps): ReactNode {
  const {
    buttonLabel,
    buttonSubLabel,
    buttonValue,
    onChange,
    disabled = false,
    iconName,
    tagText,
    isSelected = false,
    largeDesktopBorderRadius = false,
    radioButtonType = 'large',
    id = typeof buttonLabel === 'string'
      ? buttonLabel
      : `RadioButtonId_${buttonValue}`,
    maxLines = 1,
    setHovered,
    setNoHover,
    testid,
    ariaDisabled = false,
    onClick,
  } = props
  const isLarge = radioButtonType === 'large'

  const getButtonStyle = (
    isSelected: boolean,
    disabled: boolean
  ): FlattenSimpleInterpolation => {
    if (disabled) return DISABLED_BUTTON_STYLE
    if (isSelected) return SELECTED_BUTTON_STYLE(disabled)
    return AVAILABLE_BUTTON_STYLE(disabled)
  }

  return (
    <RadioButtonWrapper>
      <SettingButton
        checked={isSelected}
        disabled={ariaDisabled ? false : disabled}
        id={id}
        onChange={ariaDisabled ? () => {} : onChange}
        type="radio"
        value={buttonValue}
        onClick={onClick}
      />
      <SettingButtonLabel
        data-testid={testid}
        tabIndex={0}
        isLarge={isLarge}
        maxLines={maxLines}
        largeDesktopBorderRadius={largeDesktopBorderRadius}
        disabled={disabled}
        isSelected={isSelected}
        role="label"
        htmlFor={id}
        onMouseEnter={setHovered}
        onMouseLeave={setNoHover}
        css={getButtonStyle(isSelected, disabled)}
        aria-selected={isSelected}
        aria-disabled={ariaDisabled}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
        >
          {iconName != null ? (
            <Icon
              name={iconName}
              size="1rem"
              data-testid={`icon_${iconName}`}
            />
          ) : null}
          {tagText != null ? (
            <Tag type={isSelected ? 'onColor' : 'default'} text={tagText} />
          ) : null}
          <Flex css={copyContainerStyle(buttonSubLabel)}>
            {typeof buttonLabel === 'string' ? (
              <StyledText
                oddStyle={isLarge ? 'level4HeaderSemiBold' : 'bodyTextRegular'}
                desktopStyle={
                  isLarge ? 'bodyDefaultSemiBold' : 'bodyDefaultRegular'
                }
              >
                {buttonLabel}
              </StyledText>
            ) : (
              buttonLabel
            )}
            {buttonSubLabel && (
              <Flex
                css={SUBBUTTON_LABEL_STYLE(
                  disabled,
                  isSelected,
                  buttonSubLabel
                )}
              >
                <StyledText
                  color={isSelected ? COLORS.white : COLORS.grey60}
                  oddStyle="bodyTextRegular"
                  desktopStyle="bodyDefaultRegular"
                >
                  {buttonSubLabel.label}
                </StyledText>
              </Flex>
            )}
          </Flex>
        </Flex>
      </SettingButtonLabel>
    </RadioButtonWrapper>
  )
}

const copyContainerStyle = (
  buttonSubLabel: RadioButtonSubLabel | undefined
): FlattenSimpleInterpolation => css`
  flex-direction: ${
    buttonSubLabel?.align === 'vertical' ? DIRECTION_COLUMN : DIRECTION_ROW
  };
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${
    buttonSubLabel?.align === 'vertical' ? ALIGN_START : ALIGN_CENTER
  };
  width: ${buttonSubLabel != null ? '100%' : ''};
  word-break: break-word;
`

const AVAILABLE_BUTTON_STYLE = (
  disabled: boolean
): FlattenSimpleInterpolation => css`
  background: ${COLORS.blue35};

  &:hover,
  &:active {
    background-color: ${disabled ? COLORS.grey35 : COLORS.blue40};
  }
`

const SELECTED_BUTTON_STYLE = (
  disabled: boolean
): FlattenSimpleInterpolation => css`
  background: ${COLORS.blue50};
  color: ${COLORS.white};

  &:active {
    background-color: ${disabled ? COLORS.grey35 : COLORS.blue60};
  }
`

//  TODO: the max line to clamp for subtext
const SUBBUTTON_LABEL_STYLE = (
  disabled: boolean,
  isSelected: boolean,
  buttonSubLabel: RadioButtonSubLabel
): FlattenSimpleInterpolation => css`
  color: ${
    disabled ? COLORS.grey50 : isSelected ? COLORS.white : COLORS.grey60
  };
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${buttonSubLabel?.align === 'vertical' ? 2 : 1};
  overflow: hidden;
  word-break: break-word;
  text-overflow: ellipsis;
`

const DISABLED_BUTTON_STYLE = css`
  background-color: ${COLORS.grey35};
  color: ${COLORS.grey50};

  &:hover,
  &:active {
    background-color: ${COLORS.grey35};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: ${CURSOR_NOT_ALLOWED};
  }
`

interface RadioButtonWrapperProps {
  width?: string
}

const RadioButtonWrapper = styled(Flex)<RadioButtonWrapperProps>`
  width: ${({ width }) => width ?? 'auto'};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 100%;
  }
`

const SettingButton = styled.input`
  display: none;
`

interface SettingsButtonLabelProps {
  isSelected: boolean
  disabled: boolean
  largeDesktopBorderRadius: boolean
  isLarge: boolean
  maxLines?: number | null
}

const SettingButtonLabel = styled.label<SettingsButtonLabelProps>`
  border-radius: ${({ largeDesktopBorderRadius }) =>
    !largeDesktopBorderRadius ? BORDERS.borderRadius40 : BORDERS.borderRadius8};
  cursor: ${CURSOR_POINTER};
  padding: ${SPACING.spacing12} ${SPACING.spacing16};
  width: 100%;

  ${({ disabled }) => disabled && DISABLED_BUTTON_STYLE}

  /* note this is to disable the black outline that is the browser’s default focus ring  */
  &:focus {
    outline: none;
  }
  &:focus-visible:not([aria-selected='true']) {
    /* outline: 2px solid ${COLORS.blue55}; */
    color: ${COLORS.blue55};
    outline: 2px solid ${COLORS.blue55};
    outline-offset: 0.12rem;
  }

  &[aria-disabled='true'] {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};

    &:hover,
    &:active {
      background-color: ${COLORS.grey35};
    }
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: ${CURSOR_DEFAULT};
    padding: ${({ largeDesktopBorderRadius }) =>
      largeDesktopBorderRadius ? SPACING.spacing24 : SPACING.spacing20};
    border-radius: ${BORDERS.borderRadius16};
    display: ${({ maxLines }) => (maxLines != null ? '-webkit-box' : 'none')};
    -webkit-line-clamp: ${({ maxLines }) => maxLines ?? 'none'};
    -webkit-box-orient: ${({ maxLines }) =>
      maxLines != null ? 'vertical' : 'none'};
    word-wrap: break-word;
    word-break: break-all;
  }
`
