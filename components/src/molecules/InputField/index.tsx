import { forwardRef, useId, useRef } from 'react'
import styled, { css } from 'styled-components'

import { StyledText } from '../../atoms/StyledText'
import { Tooltip } from '../../atoms/Tooltip'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  NO_WRAP,
  TEXT_ALIGN_RIGHT,
} from '../../styles'
import { useHoverTooltip } from '../../tooltips'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { setRefs } from '../../utils'

import type {
  ChangeEventHandler,
  FocusEvent,
  MouseEvent,
  ReactNode,
} from 'react'

export const INPUT_TYPE_NUMBER = 'number' as const
export const LEGACY_INPUT_TYPE_TEXT = 'text' as const
export const LEGACY_INPUT_TYPE_PASSWORD = 'password' as const
const COLOR_WARNING_DARK = '#9e5e00' // ToDo (kk:08/13/2024) replace this with COLORS

export interface InputFieldProps {
  /** field is disabled if value is true */
  disabled?: boolean
  /** change handler */
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** name of field in form */
  name?: string
  /** optional ID of <input> element */
  id?: string
  /** placeholder text */
  placeholder?: string
  /** optional suffix component, appears to the right of input text */
  units?: ReactNode
  /** current value of text in box, defaults to '' */
  value?: string | number | null
  /** if included, InputField will use error style and display error instead of caption */
  error?: string | null
  /** optional title */
  title?: string | null // ToDo chnage this prop to "label"
  /** optional text for tooltip */
  tooltipText?: string
  /** optional caption. hidden when `error` is given */
  caption?: string | null
  /** optional input type (default "text") */
  type?:
    | typeof LEGACY_INPUT_TYPE_TEXT
    | typeof LEGACY_INPUT_TYPE_PASSWORD
    | typeof INPUT_TYPE_NUMBER
  /** mouse click handler */
  onClick?: (event: MouseEvent<HTMLElement>) => unknown
  /** focus handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => unknown
  /** blur handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => unknown
  /** makes input field read-only */
  readOnly?: boolean
  /** html tabindex property */
  tabIndex?: number
  /** automatically focus field on renders */
  autoFocus?: boolean
  /** if true, clear out value and add '-' placeholder */
  isIndeterminate?: boolean
  /** if input type is number, these are the min and max values */
  max?: number | string
  min?: number | string
  /** horizontal text alignment for title, input, and (sub)captions */
  textAlign?:
    typeof TYPOGRAPHY.textAlignLeft | typeof TYPOGRAPHY.textAlignCenter
  /** small or medium input field height, relevant only */
  size?: 'medium' | 'small'
  /** optional element to display aligned to the left of the input field */
  leftElement?: ReactNode
  /** optional element to display aligned to the right of the input field */
  rightElement?: ReactNode
  /** optional prop to override input field border radius */
  borderRadius?: string
  /** optional prop to override input field padding */
  padding?: string
  /** optional props for data-testid */
  testId?: string
}

/**
 * InputField is for the Desktop application and web applications
 * Please do not use this for the touchscreen application
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (props, ref): JSX.Element => {
    const {
      disabled,
      id,
      placeholder: rawPlaceholder,
      units,
      value: rawValue,
      error,
      title,
      tooltipText,
      caption,
      type,
      onClick,
      tabIndex = 0,
      isIndeterminate = false,
      textAlign = TYPOGRAPHY.textAlignLeft,
      size = 'small',
      leftElement,
      rightElement,
      borderRadius,
      padding,
      testId,
      ...inputProps
    } = props
    const [targetProps, tooltipProps] = useHoverTooltip()
    const internalRef = useRef<HTMLInputElement>(null)
    const mergedRef = setRefs(ref, internalRef)
    const generatedId = useId()
    const inputId = id ?? generatedId

    const hasError = error != null
    // todo(mm, 2026-07-17): The way we're defaulting `value` here means that this
    // input can never be uncontrolled (value=undefined), which has performance
    // implications and can make this inconvenient to integrate with react-hook-form.
    // Do we need this?
    const value = (isIndeterminate ?? false) ? '' : (rawValue ?? '')
    const placeHolder = (isIndeterminate ?? false) ? '-' : rawPlaceholder

    const INPUT_FIELD = css`
      background-color: ${COLORS.white};
      border-radius: ${
        borderRadius != null ? borderRadius : BORDERS.borderRadius4
      };
      padding: ${padding ?? SPACING.spacing8};
      border: 1px ${BORDERS.styleSolid}
        ${hasError ? COLORS.red50 : COLORS.grey50};
      font-size: ${TYPOGRAPHY.fontSizeP};
      width: 100%;
      height: ${size === 'small' ? '2rem' : '2.75rem'};

      &:active:enabled {
        border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
      }

      & input {
        border-radius: inherit;
        color: ${COLORS.black90};
        border: none;
        flex: 1 1 auto;
        width: 100%;
        height: ${SPACING.spacing16};
        text-align: ${textAlign};
      }
      & input:focus {
        outline: none;
      }

      &:hover {
        border: 1px ${BORDERS.styleSolid}
          ${hasError ? COLORS.red50 : COLORS.grey60};
      }

      &:focus-visible {
        border: 1px ${BORDERS.styleSolid} ${COLORS.grey55};
        outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
        outline-offset: 2px;
      }

      &:focus-within {
        border: 1px ${BORDERS.styleSolid}
          ${hasError ? COLORS.red50 : COLORS.blue50};
      }

      &:disabled {
        border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
      }

      input[type='number']::-webkit-inner-spin-button,
      input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `

    const TITLE_STYLE = css`
      color: ${COLORS.grey60};
      padding-bottom: ${SPACING.spacing4};
      text-align: ${textAlign};
      font-size: ${TYPOGRAPHY.fontSizeH3};
      line-height: ${TYPOGRAPHY.lineHeight20};
      font-weight: ${TYPOGRAPHY.fontWeightRegular};
    `

    const UNITS_STYLE = css`
      color: ${disabled ? COLORS.grey40 : COLORS.grey50};
      font: ${TYPOGRAPHY.bodyTextRegular};
      text-align: ${TYPOGRAPHY.textAlignRight};
      white-space: ${NO_WRAP};
    `

    return (
      <Flex
        width="100%"
        alignItems={ALIGN_CENTER}
        lineHeight={1}
        fontSize={TYPOGRAPHY.fontSizeP}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={error != null ? COLOR_WARNING_DARK : COLORS.black90}
        opacity={disabled === true ? 0.5 : 1}
      >
        <Flex flexDirection={DIRECTION_COLUMN} width="100%">
          {title != null ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing8}
              alignItems={ALIGN_CENTER}
            >
              <label htmlFor={inputId} css={TITLE_STYLE}>
                {title}
              </label>
              {tooltipText != null ? (
                <>
                  <Flex {...targetProps}>
                    <Icon
                      name="information"
                      size={SPACING.spacing12}
                      color={COLORS.grey60}
                    />
                  </Flex>
                  <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
                </>
              ) : null}
            </Flex>
          ) : null}
          <Flex
            width="100%"
            flexDirection={DIRECTION_COLUMN}
            onClick={disabled === true ? undefined : onClick}
          >
            <Flex
              tabIndex={tabIndex}
              css={INPUT_FIELD}
              alignItems={ALIGN_CENTER}
              onClick={() => {
                internalRef.current?.focus()
              }}
            >
              {leftElement != null ? (
                <Flex marginRight={SPACING.spacing8}>{leftElement}</Flex>
              ) : null}
              <StyledInput
                {...inputProps}
                id={inputId}
                data-testid={testId}
                value={value}
                placeholder={placeHolder}
                onWheel={event => {
                  event.currentTarget.blur()
                }} // prevent value change with scrolling
                type={type}
                disabled={disabled}
                ref={mergedRef}
              />
              {units != null ? <Flex css={UNITS_STYLE}>{units}</Flex> : null}
              {rightElement != null ? (
                <Flex
                  alignSelf={TEXT_ALIGN_RIGHT}
                  onClick={e => {
                    e.stopPropagation()
                  }}
                >
                  {rightElement}
                </Flex>
              ) : null}
            </Flex>
          </Flex>
          {caption != null ? (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              css={FORM_BOTTOM_SPACE_STYLE}
              color={hasError ? COLORS.red50 : COLORS.grey60}
            >
              {caption}
            </StyledText>
          ) : null}
          {hasError ? (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              css={ERROR_TEXT_STYLE}
            >
              {error}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
    )
  }
)

// for debugging
InputField.displayName = 'InputField'

const ERROR_TEXT_STYLE = css`
  color: ${COLORS.red50};
  padding-top: ${SPACING.spacing4};
`

const FORM_BOTTOM_SPACE_STYLE = css`
  padding-top: ${SPACING.spacing4};
`

const StyledInput = styled.input`
  background-color: transparent;
  &::placeholder {
    color: ${COLORS.grey40};
  }
`
