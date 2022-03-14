import * as React from 'react'
import {
  Flex,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  TEXT_ALIGN_RIGHT,
  DISPLAY_INLINE_BLOCK,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { css } from 'styled-components'

export const INPUT_TYPE_NUMBER: 'number' = 'number'
export const INPUT_TYPE_TEXT: 'text' = 'text'
export const INPUT_TYPE_PASSWORD: 'password' = 'password'

// TODO: Ian 2018-09-14 remove 'label' prop when IngredientPropertiesForm gets updated

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
  units?: React.ReactNode // TODO: Ian 2018-10-30 rename to 'suffix'
  /** current value of text in box, defaults to '' */
  value?: string | null | undefined
  /** if included, InputField will use error style and display error instead of caption */
  error?: string | null | undefined
  /** optional caption. hidden when `error` is given */
  caption?: string | null | undefined
  /** appears to the right of the caption. Used for character limits, eg '0/45' */
  secondaryCaption?: string | null | undefined
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
  /** automatically focus field on render */
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
      fontSize="11px"
      fontWeight={400}
      color={props.error ? '#9e5e00' : COLORS.darkBlack}
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
    flex: 1 1;
    background-color: ${COLORS.white};
    border-radius: ${SPACING.spacing2};
    padding: ${SPACING.spacing3};
    border: 1px solid ${error ? COLORS.error : COLORS.medGrey};
    font-size: 11px;

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
      border: 1px solid ${error ? COLORS.error : '#b8b8b8'};
    }
    &:focus {
      border: 1px solid ${COLORS.blue};
    }
    &:disabled {
      border: 1px solid ${COLORS.greyDisabled};
    }
  `

  return (
    <Flex width="100%" flexDirection={DIRECTION_COLUMN}>
      <Flex css={INPUT_FIELD}>
        <input
          disabled={props.disabled}
          data-testid={props.id}
          type={props.type}
          value={value}
          name={props.name}
          placeholder={placeHolder}
          onFocus={props.disabled ? undefined : props.onFocus}
          onBlur={props.onBlur}
          onClick={props.disabled ? undefined : props.onClick}
          readOnly={props.readOnly}
          tabIndex={props.tabIndex}
          onChange={props.disabled ? undefined : props.onChange}
          autoFocus={props.autoFocus}
          min={props.min ?? undefined}
          max={props.max ?? undefined}
        />
        {props.units && (
          <Flex
            display={DISPLAY_INLINE_BLOCK}
            flex="1 0"
            textAlign={TEXT_ALIGN_RIGHT}
            alignSelf={ALIGN_CENTER}
            color={COLORS.darkGreyEnabled}
            fontSize={TYPOGRAPHY.fontSizeH6}
          >
            {props.units}
          </Flex>
        )}
      </Flex>
      <Flex
        color={error ? COLORS.error : COLORS.darkGreyEnabled}
        fontSize={SPACING.spacingSM}
        paddingTop={SPACING.spacing2}
      >
        <span>{error ? props.error : props.caption}</span>
        <span>{props.secondaryCaption}</span>
      </Flex>
    </Flex>
  )
}
