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
} from 'react'
import type { IconName } from '../../icons'

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
  /** optional IconName to display icon aligned to left of textarea field */
  leftIcon?: IconName
  /** if true, show delete icon aligned to right of textarea field */
  showDeleteIcon?: boolean
  /** callback passed to optional delete icon onClick */
  onDelete?: () => void
  /** if true, style the background of textarea field to error state */
  hasBackgroundError?: boolean
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
    leftIcon,
    showDeleteIcon = false,
    onDelete,
    hasBackgroundError = false,
    onWrapperClick,
    borderRadius,
    padding,
    height,
    resize = 'none',
    isIndeterminate,
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
    rawDisabled === true && styles.disabled
  )

  const textareaClasses = clsx(
    styles.textarea,
    hasError && styles.textarea_error,
    hasBackgroundError && styles.textarea_background_error,
    isKeyboardFocus && styles.textarea_keyboard_focus
  )

  const titleClasses = clsx(
    styles.title_text,
    textAlign === 'center' ? styles.title_text_center : styles.title_text_left
  )

  const textareaRowClasses = clsx(
    styles.textarea_row,
    leftIcon !== undefined && styles.textarea_row_with_icon
  )

  return (
    <div className={wrapperClasses}>
      <div className={styles.column_container}>
        {label != null && (
          <div className={styles.title_row}>
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
          className={styles.clickable_column}
          onClick={!rawDisabled ? onWrapperClick : undefined}
        >
          <div className={textareaRowClasses}>
            {leftIcon !== undefined && (
              <div className={styles.left_icon_wrapper}>
                <Icon
                  name={leftIcon}
                  color={COLORS.grey60}
                  size="1.25rem"
                  data-testid="left-icon"
                />
              </div>
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
            {showDeleteIcon && (
              <div className={styles.delete_icon_wrapper} onClick={onDelete}>
                <Icon name="close" size="1.75rem" />
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
