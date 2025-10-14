import clsx from 'classnames'

import styles from './button.module.css'

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'

export type ButtonVariant = 'default' | 'alert' | 'alt'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /** The visual style variant of the button */
  variant?: ButtonVariant
  /** Custom border radius (default: 8px, rounded: 200px) */
  rounded?: boolean
  /** Button content */
  children: ReactNode
  /** Click handler */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  /** Native HTML disabled - removes button from tab order */
  disabled?: boolean
  /** Accessible disabled - keeps button in tab order for screen readers */
  'aria-disabled'?: boolean
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset'
  /** Additional CSS class names */
  className?: string
}

/**
 * Unified Button component using CSS Modules.
 * Supports three variants: default (blue), alert (red), and alt (grey).
 * Handles both native disabled and aria-disabled for accessibility.
 */
export function Button({
  variant = 'default',
  rounded = false,
  children,
  onClick,
  disabled = false,
  'aria-disabled': ariaDisabled = false,
  type = 'button',
  className,
  ...restProps
}: ButtonProps): JSX.Element {
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    // Prevent onClick when aria-disabled is true
    if (ariaDisabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  const buttonClassName = clsx(
    styles.button,
    styles[`variant_${variant}`],
    rounded && styles.rounded,
    className
  )

  return (
    <button
      className={buttonClassName}
      onClick={handleClick}
      disabled={disabled}
      {...(ariaDisabled ? { 'aria-disabled': true } : {})}
      type={type}
      {...restProps}
    >
      {children}
    </button>
  )
}
