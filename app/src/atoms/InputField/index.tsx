import * as React from 'react'
import {
  Flex,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  TEXT_ALIGN_RIGHT,
  DISPLAY_INLINE_BLOCK,
  SPACING,
  BORDERS,
  TYPOGRAPHY,
  COLOR_WARNING_DARK,
} from '@opentrons/components'
import { css } from 'styled-components'

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
      color={props.error ? COLOR_WARNING_DARK : COLORS.darkBlack}
      opacity={props.disabled ? 0.5 : ''}
    >
      <Input {...props} />
    </Flex>
  )
}

function Input(props: InputFieldProps): JSX.Element {
  const error = props.error != null
  const value = props.isIndeterminate ? '' : props.value ?? ''
  const placeHolder = props.isIndeterminate ? '-' : props.placeholder

  const INPUT_FIELD = css`
    display: flex;
    background-color: ${COLORS.white};
    border-radius: ${SPACING.spacing2};
    padding: ${SPACING.spacing3};
    border: ${SPACING.spacingXXS} ${BORDERS.styleSolid}
      ${error ? COLORS.error : COLORS.medGrey};
    font-size: ${TYPOGRAPHY.fontSizeP};

    &:active {
      border: ${SPACING.spacingXXS} ${BORDERS.styleSolid}
        ${COLORS.darkGreyEnabled};
    }

    & input {
      border-radius: inherit;
      color: ${COLORS.darkBlack};
      border: none;
      flex: 1 1 auto;
      width: 100%;
      height: ${SPACING.spacing4};
    }
    & input:focus {
      outline: none;
    }

    &:hover {
      border: ${SPACING.spacingXXS} ${BORDERS.styleSolid}
        ${error ? COLORS.error : COLORS.medGreyHover};
    }
    &:focus {
      border: ${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.blue};
    }
    &:disabled {
      border: ${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.greyDisabled};
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
        {props.units && (
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
        paddingTop={SPACING.spacing2}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex paddingBottom={SPACING.spacing2}>{props.caption}</Flex>
        {props.secondaryCaption ? (
          <Flex paddingBottom={SPACING.spacing2}>{props.secondaryCaption}</Flex>
        ) : null}
        <Flex color={COLORS.error}>{props.error}</Flex>
      </Flex>
    </Flex>
  )
}
