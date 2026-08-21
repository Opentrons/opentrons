import { forwardRef, useId, useRef } from 'react'
import clsx from 'clsx'

import { StyledText } from '../../atoms/StyledText'
import { COLORS } from '../../helix-design-system'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { setRefs } from '../../utils'
import styles from './touchinputfield.module.css'

import type {
  ChangeEventHandler,
  CSSProperties,
  FocusEvent,
  MouseEvent,
  ReactNode,
} from 'react'

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
  /** optional caption */
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
    typeof TYPOGRAPHY.textAlignLeft | typeof TYPOGRAPHY.textAlignCenter
  /** small or medium input field height */
  size?: 'medium' | 'small'
  /** optional prop to override input field border radius */
  borderRadius?: string
  /** optional prop to override input field padding */
  padding?: string
  /** optional input type */
  type?: 'text' | 'password' | 'number'
  /** optional props for data-testid */
  testId?: string
}

export const TouchInputField = forwardRef<
  HTMLInputElement,
  TouchInputFieldProps
>((props, ref): JSX.Element => {
  const {
    disabled,
    id,
    placeholder: rawPlaceholder,
    units,
    value: rawValue,
    error,
    label,
    caption,
    onClick,
    isIndeterminate = false,
    textAlign = TYPOGRAPHY.textAlignLeft,
    size = 'small',
    borderRadius,
    padding,
    type,
    testId,
    ...inputProps
  } = props

  const internalRef = useRef<HTMLInputElement>(null)
  const mergedRef = setRefs(ref, internalRef)
  const generatedId = useId()
  const inputId = id ?? generatedId

  const hasError = error != null
  const value = isIndeterminate ? '' : (rawValue ?? '')
  const placeHolder = isIndeterminate ? '-' : rawPlaceholder

  const inputFieldStyles: CSSProperties & {
    '--touch-input-border-radius': string
    '--touch-input-padding': string
  } = {
    '--touch-input-border-radius': borderRadius ?? 'var(--border-radius-4)',
    '--touch-input-padding': padding ?? 'var(--spacing-16) var(--spacing-24)',
  }

  return (
    <div
      className={clsx(styles.container, {
        [styles.container_error]: hasError,
        [styles.container_disabled]: disabled,
      })}
    >
      <div className={styles.inner}>
        {label != null ? (
          <div className={styles.label_row}>
            <label
              htmlFor={inputId}
              className={clsx(
                styles.label,
                textAlign === TYPOGRAPHY.textAlignCenter
                  ? styles.align_center
                  : styles.align_left
              )}
            >
              {label}
            </label>
          </div>
        ) : null}

        <div
          className={clsx(styles.outer, {
            [styles.outer_error]: hasError,
          })}
          onClick={disabled === true ? undefined : onClick}
        >
          <div
            style={inputFieldStyles}
            className={clsx(
              styles.input_field,
              size === 'small'
                ? styles.input_field_small
                : styles.input_field_medium,
              {
                [styles.error]: hasError,
              }
            )}
            onClick={() => {
              internalRef.current?.focus()
            }}
          >
            <input
              {...inputProps}
              id={inputId}
              data-testid={testId}
              className={clsx(
                styles.input,
                size === 'small' ? styles.input_small : styles.input_medium,
                type === 'password' ? styles.password_input : null,
                textAlign === TYPOGRAPHY.textAlignCenter
                  ? styles.align_center
                  : styles.align_left
              )}
              value={value}
              placeholder={placeHolder}
              onWheel={event => {
                event.currentTarget.blur()
              }}
              type={type}
              disabled={disabled}
              ref={mergedRef}
            />
            {units != null ? (
              <div
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
                {units}
              </div>
            ) : null}
          </div>
        </div>

        {caption != null ? (
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.caption}
            color={hasError ? COLORS.red50 : COLORS.grey60}
          >
            {caption}
          </StyledText>
        ) : null}

        {hasError ? (
          <StyledText oddStyle="bodyTextRegular" className={styles.error_text}>
            {error}
          </StyledText>
        ) : null}
      </div>
    </div>
  )
})

// for debugging
TouchInputField.displayName = 'TouchInputField'
