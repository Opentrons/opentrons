import { forwardRef, useId } from 'react'
import clsx from 'clsx'

import { COLORS, StyledText } from '@opentrons/components'

import styles from './touchtextareafield.module.css'

import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEventHandler,
} from 'react'

type NativeTextareaProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'title'>

// ToDo support a11y add aria-*
interface TouchTextAreaFieldProps extends NativeTextareaProps {
  /** optional label */
  label?: string | null
  /** if included, TextAreaField will use error style and display error instead of caption */
  error?: string | null
  /** optional caption. hidden when `error` is given */
  caption?: string | null
  /** horizontal text alignment for label, textarea, and (sub)captions */
  textAlign?: 'left' | 'center'
  /** optional prop to support focus when tapping text area */
  onWrapperClick?: MouseEventHandler<HTMLDivElement>
  /** optional prop to override textarea field border radius */
  borderRadius?: CSSProperties['borderRadius']
  /** optional prop to override textarea field padding */
  padding?: CSSProperties['padding']
  /** optional prop to override textarea field height */
  height?: CSSProperties['height']
  /** optional prop to override textarea field resize default is none */
  resize?: CSSProperties['resize']
  /** if true, clear out value and add '-' placeholder */
  isIndeterminate?: boolean
  /** if true, stretch the textarea to fill available height in a flex column parent */
  multiline?: boolean
}

export const TouchTextAreaField = forwardRef<
  HTMLTextAreaElement,
  TouchTextAreaFieldProps
>((props, ref): JSX.Element => {
  const {
    label,
    error,
    caption,
    textAlign = 'left',
    onWrapperClick,
    borderRadius,
    padding,
    height,
    resize = 'none',
    isIndeterminate,
    multiline = false,
    ...textareaProps
  } = props
  const {
    disabled: rawDisabled,
    placeholder: rawPlaceholder,
    value: rawValue,
    ...restTextareaProps
  } = textareaProps
  const generatedId = useId()
  const textareaId = restTextareaProps.id ?? generatedId
  const hasError = error != null
  const value = (isIndeterminate ?? false) ? '' : (rawValue ?? '')
  const placeHolderText = (isIndeterminate ?? false) ? '-' : rawPlaceholder

  const wrapperClasses = clsx(
    styles.wrapper,
    hasError ? styles.error_color : styles.default_color,
    rawDisabled === true && styles.disabled,
    multiline && styles.wrapper_multiline
  )

  const textareaClasses = clsx(
    styles.textarea,
    hasError && styles.textarea_error,
    multiline && styles.textarea_multiline
  )

  const labelClasses = clsx(
    styles.label_text,
    hasError && styles.label_text_error,
    textAlign === 'center' ? styles.label_text_center : styles.label_text_left
  )

  return (
    <div className={wrapperClasses}>
      <div
        className={clsx(
          styles.column_container,
          multiline && styles.column_container_multiline
        )}
      >
        {label != null && (
          <div className={styles.label_row}>
            <label htmlFor={textareaId}>
              <StyledText oddStyle="bodyTextRegular" className={labelClasses}>
                {label}
              </StyledText>
            </label>
          </div>
        )}
        <div
          className={clsx(
            styles.clickable_column,
            multiline && styles.clickable_column_multiline
          )}
          onClick={!rawDisabled ? onWrapperClick : undefined}
        >
          <div
            className={clsx(
              styles.textarea_row,
              multiline && styles.textarea_row_multiline
            )}
          >
            <textarea
              id={textareaId}
              className={textareaClasses}
              style={{
                borderRadius: borderRadius ?? undefined,
                padding: padding ?? undefined,
                height: height ?? undefined,
                resize: resize,
              }}
              disabled={rawDisabled}
              value={value}
              placeholder={placeHolderText}
              ref={ref}
              {...restTextareaProps}
            />
          </div>
        </div>
        {!hasError && caption != null && (
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.caption_text}
            color={COLORS.grey60}
          >
            {caption}
          </StyledText>
        )}
        {hasError && (
          <StyledText oddStyle="bodyTextRegular" className={styles.error_text}>
            {error}
          </StyledText>
        )}
      </div>
    </div>
  )
})
