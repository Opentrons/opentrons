import { forwardRef, useEffect, useState } from 'react'

import { StyledText, Tooltip } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { useHoverTooltip } from '../../tooltips/useHoverTooltip'
import { SPACING } from '../../ui-style-constants'
import styles from './textareafield.module.css'

import type {
  ChangeEventHandler,
  FocusEvent,
  MouseEvent,
  MutableRefObject,
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

export interface TextAreaFieldProps {
  /** field is disabled if value is true */
  disabled?: boolean
  /** change handler */
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  /** name of field in form */
  name?: string
  /** optional ID of <textarea> element */
  id?: string
  /** placeholder text */
  placeholder?: string
  /** current value of text in box, defaults to '' */
  value?: string | number | null
  /** if included, TextAreaField will use error style and display error instead of caption */
  error?: string | null
  /** optional title */
  title?: string | null
  /** optional text for tooltip */
  tooltipText?: string
  /** optional caption. hidden when `error` is given */
  caption?: string | null
  /** mouse click handler */
  onClick?: (event: MouseEvent<HTMLTextAreaElement | HTMLDivElement>) => unknown
  /** focus handler */
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => unknown
  /** blur handler */
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => unknown
  /** makes textarea field read-only */
  readOnly?: boolean
  /** automatically focus field on renders */
  autoFocus?: boolean
  /** if true, clear out value and add '-' placeholder */
  isIndeterminate?: boolean
  /** horizontal text alignment for title, textarea, and (sub)captions */
  textAlign?: 'left' | 'center'
  /** react useRef to control textarea field instead of react event */
  ref?: MutableRefObject<HTMLTextAreaElement | null>
  /** optional IconName to display icon aligned to left of textarea field */
  leftIcon?: IconName
  /** if true, show delete icon aligned to right of textarea field */
  showDeleteIcon?: boolean
  /** callback passed to optional delete icon onClick */
  onDelete?: () => void
  /** if true, style the background of textarea field to error state */
  hasBackgroundError?: boolean
  /** optional prop to override textarea field border radius */
  borderRadius?: string
  /** optional prop to override textarea field padding */
  padding?: string
  /** optional prop to override textarea field height */
  height?: string
  /** optional prop to override textarea field resize default is none */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>((props, ref): JSX.Element => {
  const {
    placeholder,
    textAlign = 'left',
    title,
    tooltipText,
    error,
    disabled,
    isIndeterminate,
    showDeleteIcon = false,
    hasBackgroundError = false,
    onDelete,
    borderRadius,
    padding,
    height,
    leftIcon,
    caption,
    resize = 'none',
    id,
    name,
    onChange,
    onFocus,
    onBlur,
    readOnly,
    autoFocus,
  } = props

  const hasError = error != null
  const value = (isIndeterminate ?? false) ? '' : (props.value ?? '')
  const placeHolder = (isIndeterminate ?? false) ? '-' : placeholder
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isKeyboardFocus = useFocusVisible() // Track focus method

  const wrapperClasses = [
    styles.wrapper,
    error != null ? styles.warning_color : styles.default_color,
    disabled === true ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ')

  const textareaClasses = [
    styles.textarea,
    hasError ? styles.textarea_error : '',
    hasBackgroundError ? styles.textarea_background_error : '',
    isKeyboardFocus ? styles.textarea_keyboard_focus : '',
  ]
    .filter(Boolean)
    .join(' ')

  const titleClasses = [
    styles.title_text,
    textAlign === 'center' ? styles.title_text_center : styles.title_text_left,
  ].join(' ')

  const textareaRowClasses = [
    styles.textarea_row,
    leftIcon !== undefined ? styles.textarea_row_with_icon : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClasses}>
      <div className={styles.column_container}>
        {title != null && (
          <div className={styles.title_row}>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              className={titleClasses}
            >
              {title}
            </StyledText>
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
          onClick={!disabled ? props.onClick : undefined}
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
              data-testid="TextAreaField"
              className={textareaClasses}
              style={{
                borderRadius: borderRadius ?? undefined,
                padding: padding ?? undefined,
                height: height ?? undefined,
                resize: resize,
              }}
              value={value}
              placeholder={placeHolder}
              onWheel={event => {
                event.currentTarget.blur()
              }}
              ref={ref}
              disabled={disabled}
              id={id}
              name={name}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              readOnly={readOnly}
              autoFocus={autoFocus}
            />
            {showDeleteIcon && (
              <div className={styles.delete_icon_wrapper} onClick={onDelete}>
                <Icon name="close" size="1.75rem" />
              </div>
            )}
          </div>
        </div>
        {caption != null && (
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
