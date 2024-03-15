import * as React from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLOR_WARNING_DARK,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
  TEXT_ALIGN_RIGHT,
} from '@opentrons/components'

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
  /** optional caption. hidden when `error` is given */
  caption?: string | null
  /** appears to the right of the caption. Used for character limits, eg '0/45' */
  secondaryCaption?: string | null
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
  readOnly?: boolean | undefined
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
}

export function InputField(props: InputFieldProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      lineHeight={1}
      fontSize={TYPOGRAPHY.fontSizeP}
      fontWeight={TYPOGRAPHY.fontWeightRegular}
      color={props.error != null ? COLOR_WARNING_DARK : COLORS.black90}
      opacity={props.disabled ?? false ? 0.5 : ''}
    >
      <Input {...props} />
    </Flex>
  )
}

function Input(props: InputFieldProps): JSX.Element {
  const {
    placeholder,
    textAlign = TYPOGRAPHY.textAlignLeft,
    size = 'small',
    title,
    ...inputProps
  } = props
  const error = props.error != null
  const value = props.isIndeterminate ?? false ? '' : props.value ?? ''
  const placeHolder = props.isIndeterminate ?? false ? '-' : props.placeholder

  const OUTER_CSS = css`
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      &:focus-within {
        filter: ${error
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
    border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.grey50};
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
      border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.grey60};
    }

    &:focus-visible {
      border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.grey60};
      outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
      outline-offset: 3px;
    }

    &:focus-within {
      border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.blue50};
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
      box-shadow: ${error ? BORDERS.shadowBig : 'none'};
      font-size: ${TYPOGRAPHY.fontSize28};
      padding: ${SPACING.spacing16} ${SPACING.spacing24};
      border: 2px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.grey50};

      &:focus-within {
        box-shadow: none;
        border: ${error ? '2px' : '3px'} ${BORDERS.styleSolid}
          ${error ? COLORS.red50 : COLORS.blue50};
      }

      & input {
        color: ${COLORS.black90};
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        font-size: ${TYPOGRAPHY.fontSize28};
        line-height: ${TYPOGRAPHY.lineHeight36};
      }
    }
  `

  const FORM_BOTTOM_SPACE_STYLE = css`
    padding-bottom: ${SPACING.spacing4};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      padding-bottom: 0;
    }
  `

  const TITLE_STYLE = css`
    color: ${error ? COLORS.red50 : COLORS.black90};
    padding-bottom: ${SPACING.spacing8};
    font-size: ${TYPOGRAPHY.fontSizeLabel};
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    line-height: ${TYPOGRAPHY.lineHeight12};
    align-text: ${textAlign};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      font-size: ${TYPOGRAPHY.fontSize22};
      font-weight: ${TYPOGRAPHY.fontWeightRegular};
      line-height: ${TYPOGRAPHY.lineHeight28};
      justify-content: ${textAlign};
    }
  `

  const ERROR_TEXT_STYLE = css`
    color: ${COLORS.red50};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      font-size: ${TYPOGRAPHY.fontSize22};
      color: ${COLORS.red50};
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
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      {props.title != null ? (
        <Flex css={TITLE_STYLE}>{props.title}</Flex>
      ) : null}
      <Flex width="100%" flexDirection={DIRECTION_COLUMN} css={OUTER_CSS}>
        <Flex
          css={INPUT_FIELD}
          alignItems={ALIGN_CENTER}
          as="label"
          for={inputProps.id}
        >
          <input
            {...inputProps}
            data-testid={props.id}
            value={value}
            placeholder={placeHolder}
          />
          {props.units != null ? (
            <Flex css={UNITS_STYLE}>{props.units}</Flex>
          ) : null}
        </Flex>
        <Flex
          color={COLORS.grey60}
          fontSize={TYPOGRAPHY.fontSizeLabel}
          paddingTop={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
        >
          {props.caption != null ? (
            <Flex css={FORM_BOTTOM_SPACE_STYLE}>{props.caption}</Flex>
          ) : null}
          {props.secondaryCaption != null ? (
            <Flex css={FORM_BOTTOM_SPACE_STYLE}>{props.secondaryCaption}</Flex>
          ) : null}
          <Flex css={ERROR_TEXT_STYLE}>{props.error}</Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
