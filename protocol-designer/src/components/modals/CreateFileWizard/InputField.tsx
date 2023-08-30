import * as React from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLOR_WARNING_DARK,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  Flex,
  RESPONSIVENESS,
  SPACING,
  TEXT_ALIGN_RIGHT,
  TYPOGRAPHY,
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
}

export function InputField(props: InputFieldProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      lineHeight={1}
      fontSize={TYPOGRAPHY.fontSizeP}
      fontWeight={TYPOGRAPHY.fontWeightRegular}
      color={props.error != null ? COLOR_WARNING_DARK : COLORS.darkBlackEnabled}
      opacity={props.disabled ?? false ? 0.5 : ''}
    >
      <Input {...props} />
    </Flex>
  )
}

// TODO(BC, 2023-06-16): reconcile this with the components library component that it was copied from
function Input(props: InputFieldProps): JSX.Element {
  const error = props.error != null
  const value = props.isIndeterminate ?? false ? '' : props.value ?? ''
  const placeHolder = props.isIndeterminate ?? false ? '-' : props.placeholder

  const INPUT_FIELD = css`
    display: flex;
    background-color: ${COLORS.white};
    border-radius: ${SPACING.spacing4};
    padding: ${SPACING.spacing8};
    border: 1px ${BORDERS.styleSolid}
      ${error ? COLORS.errorEnabled : COLORS.medGreyEnabled};
    font-size: ${TYPOGRAPHY.fontSizeP};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      padding: 0;
    }

    &:active {
      border: 1px ${BORDERS.styleSolid} ${COLORS.darkGreyEnabled};
    }

    & input {
      border-radius: inherit;
      color: ${COLORS.darkBlackEnabled};
      border: none;
      flex: 1 1 auto;
      width: 100%;
      height: ${SPACING.spacing16};
    }
    & input:focus {
      outline: none;
    }

    &:hover {
      border: 1px ${BORDERS.styleSolid}
        ${error ? COLORS.errorEnabled : COLORS.medGreyHover};
    }
    &:focus {
      border: 1px ${BORDERS.styleSolid} ${COLORS.blueEnabled};
    }
    &:disabled {
      border: 1px ${BORDERS.styleSolid} ${COLORS.darkGreyDisabled};
    }
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `

  return (
    <Flex width="100%" flexDirection={DIRECTION_COLUMN}>
      <Flex css={INPUT_FIELD}>
        <input
          {...props}
          data-testid={props.id}
          value={value}
          placeholder={placeHolder}
        />
        {props.units != null && (
          <Flex
            display={DISPLAY_INLINE_BLOCK}
            textAlign={TEXT_ALIGN_RIGHT}
            alignSelf={ALIGN_CENTER}
            color={COLORS.darkGreyEnabled}
            fontSize={TYPOGRAPHY.fontSizeLabel}
          >
            {props.units}
          </Flex>
        )}
      </Flex>
      <Flex
        color={COLORS.darkGreyEnabled}
        fontSize={TYPOGRAPHY.fontSizeLabel}
        paddingTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex paddingBottom={SPACING.spacing4}>{props.caption}</Flex>
        {props.secondaryCaption != null ? (
          <Flex paddingBottom={SPACING.spacing4}>{props.secondaryCaption}</Flex>
        ) : null}
        <Flex color={COLORS.errorEnabled}>{props.error}</Flex>
      </Flex>
    </Flex>
  )
}
