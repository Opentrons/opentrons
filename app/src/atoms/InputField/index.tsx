import * as React from 'react'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLOR_WARNING_DARK,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TEXT_ALIGN_RIGHT,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import { Tooltip } from '../Tooltip'

export const INPUT_TYPE_NUMBER = 'number' as const
export const INPUT_TYPE_TEXT = 'text' as const
export const INPUT_TYPE_PASSWORD = 'password' as const

export interface InputFieldProps {
  /** field is disabled if value is true */
  disabled?: boolean
  /** change handler */
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  /** name of field in form */
  name?: string
  /** optional ID of <input> element */
  id?: string
  /** placeholder text */
  placeholder?: string
  /** optional suffix component, appears to the right of input text */
  units?: React.ReactNode
  /** current value of text in box, defaults to '' */
  value?: string | number | null
  /** if included, InputField will use error style and display error instead of caption */
  error?: string | null
  /** optional title */
  title?: string | null
  /** optional text for tooltip */
  tooltipText?: string
  /** optional caption. hidden when `error` is given */
  caption?: string | null
  /** optional input type (default "text") */
  type?:
    | typeof INPUT_TYPE_TEXT
    | typeof INPUT_TYPE_PASSWORD
    | typeof INPUT_TYPE_NUMBER
  /** mouse click handler */
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => unknown
  /** focus handler */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => unknown
  /** blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => unknown
  /** makes input field read-only */
  readOnly?: boolean
  /** html tabindex property */
  tabIndex?: number
  /** automatically focus field on renders */
  autoFocus?: boolean
  /** if true, clear out value and add '-' placeholder */
  isIndeterminate?: boolean
  /** if input type is number, these are the min and max values */
  max?: number
  min?: number
  /** horizontal text alignment for title, input, and (sub)captions */
  textAlign?:
    | typeof TYPOGRAPHY.textAlignLeft
    | typeof TYPOGRAPHY.textAlignCenter
  /** small or medium input field height, relevant only */
  size?: 'medium' | 'small'
  /** react useRef to control input field instead of react event */
  ref?: React.MutableRefObject<HTMLInputElement | null>
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (props, ref): JSX.Element => {
    const {
      placeholder,
      textAlign = TYPOGRAPHY.textAlignLeft,
      size = 'small',
      title,
      tooltipText,
      tabIndex = 0,
      ...inputProps
    } = props
    const hasError = props.error != null
    const value = props.isIndeterminate ?? false ? '' : props.value ?? ''
    const placeHolder = props.isIndeterminate ?? false ? '-' : props.placeholder
    const [targetProps, tooltipProps] = useHoverTooltip()

    const OUTER_CSS = css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        grid-gap: ${SPACING.spacing8};
        &:focus-within {
          filter: ${hasError
            ? 'none'
            : `drop-shadow(0px 0px 10px ${COLORS.blue50})`};
        }
      }
    `

    const INPUT_FIELD = css`
      display: flex;
      background-color: ${COLORS.white};
      border-radius: ${BORDERS.borderRadius4};
      padding: ${SPACING.spacing8};
      border: 1px ${BORDERS.styleSolid}
        ${hasError ? COLORS.red50 : COLORS.grey50};
      font-size: ${TYPOGRAPHY.fontSizeP};
      width: 100%;
      height: 2rem;

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

      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        height: ${size === 'small' ? '4.25rem' : '5rem'};
        font-size: ${size === 'small'
          ? TYPOGRAPHY.fontSize28
          : TYPOGRAPHY.fontSize38};
        padding: ${SPACING.spacing16} ${SPACING.spacing24};
        border: 2px ${BORDERS.styleSolid}
          ${hasError ? COLORS.red50 : COLORS.grey50};

        &:focus-within {
          box-shadow: none;
          border: ${hasError ? '2px' : '3px'} ${BORDERS.styleSolid}
            ${hasError ? COLORS.red50 : COLORS.blue50};
        }

        & input {
          color: ${COLORS.black90};
          flex: 1 1 auto;
          width: 100%;
          height: 100%;
          font-size: ${size === 'small'
            ? TYPOGRAPHY.fontSize28
            : TYPOGRAPHY.fontSize38};
          line-height: ${size === 'small'
            ? TYPOGRAPHY.lineHeight36
            : TYPOGRAPHY.lineHeight48};
        }

        /* the size of dot for password is handled by font-size */
        input[type='password'] {
          font-size: ${size === 'small' ? '71px' : '77px'};
        }
      }
    `

    const FORM_BOTTOM_SPACE_STYLE = css`
      padding-top: ${SPACING.spacing4};
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        padding: ${SPACING.spacing8} 0rem;
        padding-bottom: 0;
      }
    `

    const TITLE_STYLE = css`
      color: ${hasError ? COLORS.red50 : COLORS.black90};
      padding-bottom: ${SPACING.spacing8};
      text-align: ${textAlign};
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        font-size: ${TYPOGRAPHY.fontSize22};
        font-weight: ${TYPOGRAPHY.fontWeightRegular};
        line-height: ${TYPOGRAPHY.lineHeight28};
        justify-content: ${textAlign};
      }
    `

    const ERROR_TEXT_STYLE = css`
      color: ${COLORS.red50};
      padding-top: ${SPACING.spacing4};
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        font-size: ${TYPOGRAPHY.fontSize22};
        color: ${COLORS.red50};
        padding-top: ${SPACING.spacing8};
      }
    `

    const UNITS_STYLE = css`
      color: ${props.disabled ? COLORS.grey40 : COLORS.grey50};
      font-size: ${TYPOGRAPHY.fontSizeLabel};
      font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
      line-height: ${TYPOGRAPHY.lineHeight12};
      align-text: ${TEXT_ALIGN_RIGHT};
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        color: ${props.disabled ? COLORS.grey40 : COLORS.grey50};
        font-size: ${TYPOGRAPHY.fontSize22};
        font-weight: ${TYPOGRAPHY.fontWeightRegular};
        line-height: ${TYPOGRAPHY.lineHeight28};
        justify-content: ${textAlign};
      }
    `

    return (
      <Flex
        alignItems={ALIGN_CENTER}
        lineHeight={1}
        fontSize={TYPOGRAPHY.fontSizeP}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={props.error != null ? COLOR_WARNING_DARK : COLORS.black90}
        opacity={props.disabled ?? false ? 0.5 : ''}
      >
        <Flex flexDirection={DIRECTION_COLUMN} width="100%">
          {title != null ? (
            <Flex gridGap={SPACING.spacing8}>
              <StyledText
                as="label"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                htmlFor={props.id}
                css={TITLE_STYLE}
              >
                {title}
              </StyledText>
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
          <Flex width="100%" flexDirection={DIRECTION_COLUMN} css={OUTER_CSS}>
            <Flex
              tabIndex={tabIndex}
              css={INPUT_FIELD}
              alignItems={ALIGN_CENTER}
              onClick={() => {
                if (props.id != null) {
                  document.getElementById(props.id)?.focus()
                }
              }}
            >
              <StyledInput
                {...inputProps}
                data-testid={props.id}
                value={value}
                placeholder={placeHolder}
                onWheel={event => event.currentTarget.blur()} // prevent value change with scrolling
                type={props.type}
                ref={ref}
              />
              {props.units != null ? (
                <Flex css={UNITS_STYLE}>{props.units}</Flex>
              ) : null}
            </Flex>
          </Flex>
          {props.caption != null ? (
            <StyledText
              as="label"
              css={FORM_BOTTOM_SPACE_STYLE}
              color={COLORS.grey60}
            >
              {props.caption}
            </StyledText>
          ) : null}
          {hasError ? (
            <StyledText as="label" css={ERROR_TEXT_STYLE}>
              {props.error}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
    )
  }
)

const StyledInput = styled.input`
  &::placeholder {
    color: ${COLORS.grey40};
  }
`
