import { forwardRef, useEffect, useId, useState } from 'react'
import clsx from 'clsx'

import { StyledText, Tooltip } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { useHoverTooltip } from '../../tooltips/useHoverTooltip'
import { SPACING } from '../../ui-style-constants'
import styles from './textareafield.module.css'

import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from 'react'

// hook to detect tab focus vs mouse focus
const useFocusVisible = (): boolean => {
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') {
        setIsKeyboardFocus(true)
      }
    }
    const handleMouseDown = (): void => {
      setIsKeyboardFocus(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isKeyboardFocus
}

type NativeTextareaProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'title'>

interface TextAreaFieldProps extends NativeTextareaProps {
  /** optional label */
  label?: string | null
  /** if included, TextAreaField will use error style and display error instead of caption */
  error?: string | null
  /** optional text for tooltip */
  tooltipText?: string
  /** optional caption. hidden when `error` is given */
  caption?: string | null
  /** horizontal text alignment for title, textarea, and (sub)captions */
  textAlign?: 'left' | 'center'
  /** optional element to display aligned to the left of the input field */
  leftElement?: ReactNode
  /** optional element to display aligned to the right of the input field */
  rightElement?: ReactNode
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

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>((props, ref): JSX.Element => {
  const {
    label,
    error,
    tooltipText,
    caption,
    textAlign = 'left',
    leftElement,
    rightElement,
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
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isKeyboardFocus = useFocusVisible() // Track focus method

  const wrapperClasses = clsx(
    styles.wrapper,
    error != null ? styles.warning_color : styles.default_color,
    rawDisabled === true && styles.disabled,
    multiline && styles.wrapper_multiline
  )

  const textareaClasses = clsx(
    styles.textarea,
    hasError && styles.textarea_error,
    isKeyboardFocus && styles.textarea_keyboard_focus,
    multiline && styles.textarea_multiline
  )

  const titleClasses = clsx(
    styles.label_text,
    textAlign === 'center' ? styles.label_text_center : styles.label_text_left
  )

  const textareaRowClasses = clsx(
    styles.textarea_row,
    leftElement != null && styles.textarea_row_with_icon
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
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={titleClasses}
              >
                {label}
              </StyledText>
            </label>
            {tooltipText != null && (
              <>
                <div {...targetProps} className={styles.tooltip_wrapper}>
                  <Icon
                    name="information"
                    size={SPACING.spacing12}
                    color={COLORS.grey60}
                    data-testid="tooltip-icon"
                  />
                </div>
                <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
              </>
            )}
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
              textareaRowClasses,
              multiline && styles.textarea_row_multiline
            )}
          >
            {leftElement !== undefined && (
              <div className={styles.left_element_wrapper}>{leftElement}</div>
            )}
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
              onWheel={event => {
                event.currentTarget.blur()
              }} // prevent value change with scrolling
              ref={ref}
              {...restTextareaProps}
            />
            {rightElement != null && (
              <div
                className={styles.right_element_wrapper}
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {rightElement}
              </div>
            )}
          </div>
        </div>
        {!hasError && caption != null && (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            className={styles.caption_text}
            color={COLORS.grey60}
          >
            {caption}
          </StyledText>
        )}
        {hasError && (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            className={styles.error_text}
          >
            {props.error}
          </StyledText>
        )}
      </div>
    </div>
  )
})
