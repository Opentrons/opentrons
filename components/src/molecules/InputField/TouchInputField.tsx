import { forwardRef, useRef } from 'react'
import clsx from 'clsx'

import { StyledText } from '../../atoms/StyledText'
import { COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN, DIRECTION_ROW } from '../../styles'
import { TYPOGRAPHY } from '../../ui-style-constants'
import styles from './touchinputfield.module.css'

import type {
  ChangeEventHandler,
  CSSProperties,
  FocusEvent,
  MouseEvent,
  ReactNode,
  RefObject,
} from 'react'

const COLOR_WARNING_DARK = '#9e5e00' // ToDo (kk:08/13/2024) replace this with COLORS

export interface TouchInputFieldProps {
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
  /** optional label */
  label?: string | null
  /** optional caption. hidden when `error` is given */
  caption?: string | null
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
  /** horizontal text alignment for label, input, and (sub)captions */
  textAlign?:
    | typeof TYPOGRAPHY.textAlignLeft
    | typeof TYPOGRAPHY.textAlignCenter
  /** small or medium input field height */
  size?: 'medium' | 'small'
  /** if true, style the background of input field to error state */
  hasBackgroundError?: boolean
  /** optional prop to override input field border radius */
  borderRadius?: string
  /** optional prop to override input field padding */
  padding?: string
  /** optional input type */
  type?: 'text' | 'password' | 'number'
}

export const TouchInputField = forwardRef<
  HTMLInputElement,
  TouchInputFieldProps
>((props, ref): JSX.Element => {
  const {
    textAlign = TYPOGRAPHY.textAlignLeft,
    size = 'small',
    label,
    tabIndex = 0,
    hasBackgroundError = false,
    borderRadius,
    padding,
    disabled,
    ...inputProps
  } = props

  const internalRef = useRef<HTMLInputElement>(null)
  const inputRef = (ref ?? internalRef) as RefObject<HTMLInputElement>

  const hasError = props.error != null
  const value = (props.isIndeterminate ?? false) ? '' : (props.value ?? '')
  const placeHolder = (props.isIndeterminate ?? false) ? '-' : props.placeholder

  const input_field_style: CSSProperties = {
    borderRadius: borderRadius ?? 'var(--border-radius-4)',
    padding: padding ?? 'var(--spacing-16) var(--spacing-24)',
  }

  return (
    <Flex
      width="100%"
      alignItems={ALIGN_CENTER}
      lineHeight={1}
      fontSize={TYPOGRAPHY.fontSizeP}
      fontWeight={TYPOGRAPHY.fontWeightRegular}
      color={hasError ? COLOR_WARNING_DARK : COLORS.black90}
      opacity={disabled ? 0.5 : 1}
    >
      <Flex flexDirection={DIRECTION_COLUMN} width="100%">
        {label != null ? (
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap="var(--spacing-8)"
            alignItems={ALIGN_CENTER}
          >
            <label
              htmlFor={props.id}
              className={clsx(
                styles.label,
                textAlign === TYPOGRAPHY.textAlignCenter
                  ? styles.align_center
                  : styles.align_left
              )}
            >
              {label}
            </label>
          </Flex>
        ) : null}

        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          className={clsx(styles.outer, {
            [styles.outer_error]: hasError,
          })}
          onClick={props.disabled === true ? undefined : props.onClick}
        >
          <Flex
            tabIndex={tabIndex}
            alignItems={ALIGN_CENTER}
            className={clsx(
              styles.input_field,
              size === 'small'
                ? styles.input_field_small
                : styles.input_field_medium,
              {
                [styles.error]: hasError,
                [styles.background_error]: hasBackgroundError,
              }
            )}
            style={input_field_style}
            onClick={() => {
              inputRef.current?.focus()
            }}
          >
            <input
              {...inputProps}
              id={props.id}
              data-testid={props.id}
              className={clsx(
                styles.input,
                size === 'small' ? styles.input_small : styles.input_medium,
                props.type === 'password' ? styles.password_input : null,
                textAlign === TYPOGRAPHY.textAlignCenter
                  ? styles.align_center
                  : styles.align_left
              )}
              value={value}
              placeholder={placeHolder}
              onWheel={event => {
                event.currentTarget.blur()
              }}
              type={props.type}
              disabled={disabled}
              ref={inputRef}
            />
            {props.units != null ? (
              <Flex
                className={clsx(
                  styles.units,
                  textAlign === TYPOGRAPHY.textAlignCenter
                    ? styles.align_center
                    : styles.align_left,
                  {
                    [styles.units_disabled]: disabled,
                  }
                )}
              >
                {props.units}
              </Flex>
            ) : null}
          </Flex>
        </Flex>

        {props.caption != null ? (
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.caption}
            color={hasError ? COLORS.red50 : COLORS.grey60}
          >
            {props.caption}
          </StyledText>
        ) : null}

        {hasError ? (
          <StyledText oddStyle="bodyTextRegular" className={styles.error_text}>
            {props.error}
          </StyledText>
        ) : null}
      </Flex>
    </Flex>
  )
})
