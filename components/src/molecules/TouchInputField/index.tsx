import { forwardRef, useEffect, useId, useRef } from 'react'
import clsx from 'clsx'

import { StyledText } from '../../atoms/StyledText'
import { COLORS } from '../../helix-design-system'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { setRefs } from '../../utils'
import styles from './touchinputfield.module.css'

import type {
  ChangeEventHandler,
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
    caption,
    error,
    units,
    tabIndex = 0,
    hasBackgroundError = false,
    borderRadius,
    padding,
    disabled,
    isIndeterminate = false,
    onClick,
    ...inputProps
  } = props

  const internalRef = useRef<HTMLInputElement>(null)
  const inputFieldRef = useRef<HTMLDivElement>(null)
  const mergedRef = setRefs(ref, internalRef)
  const generatedId = useId()
  const inputId = props.id ?? generatedId

  const hasError = error != null
  const value = isIndeterminate ? '' : (props.value ?? '')
  const placeHolder = isIndeterminate ? '-' : props.placeholder

  useEffect(() => {
    if (inputFieldRef.current == null) return
    if (borderRadius != null) {
      inputFieldRef.current.style.setProperty(
        '--touch-input-border-radius',
        borderRadius
      )
    } else {
      inputFieldRef.current.style.removeProperty('--touch-input-border-radius')
    }
    if (padding != null) {
      inputFieldRef.current.style.setProperty('--touch-input-padding', padding)
    } else {
      inputFieldRef.current.style.removeProperty('--touch-input-padding')
    }
  }, [borderRadius, padding])

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
            ref={inputFieldRef}
            tabIndex={tabIndex}
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
            onClick={() => {
              internalRef.current?.focus()
            }}
          >
            <input
              {...inputProps}
              id={inputId}
              data-testid={inputId} // ToDo remove or switch to testId
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
