import clsx from 'classnames'

import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './iconbutton.module.css'

import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent } from 'react'
import type { IconName } from '../../icons'

/**
 * Regarding the following types:
 * - Variant: The color variant of the button.
 * - ButtonSize: The size of the button.
 *   If the design team requests a new size/color, we should add it to the type.
 *
 *  When a request from the design team requires a breaking change,
 *  please first consider whether it is appropriate to implement that change as an update to the design system.
 *  If the change is very localized and only needs to be applied to one or two places,
 *  please first try an approach where you override the CSS to adjust things like size and color.
 */
/**
 * Defines the color variants available for the IconButton.
 * Can be either 'primary' or 'alert'.
 */
type Variant = 'primary' | 'alert'
type ButtonSize = 'sm' | 'md'

/**
 * A record mapping color variants to their default and active color states.
 * @internal
 */
const COLOR_VARIANTS: Record<
  Variant,
  {
    default: string
    active: string
    hover: string
    icon: string
  }
> = {
  primary: {
    default: COLORS.blue50,
    active: COLORS.blue60,
    hover: COLORS.blue55,
    icon: COLORS.white,
  },
  alert: {
    default: COLORS.red50,
    active: COLORS.red60,
    hover: COLORS.red55,
    icon: COLORS.white,
  },
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: '1rem',
  md: '1.5rem',
}

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * The color variant of the button.
   */
  variant: Variant
  /**
   * The name of the icon to be displayed.
   */
  iconName: IconName
  /**
   * The size of the button (sm or md and the default size is md)
   */
  size?: ButtonSize
  /**
   * Accessible label for the button.
   */
  'aria-label': string
  /**
   * Whether the button is disabled.
   * ToDo: (kk: 2026-06-12) for this case, there is no specific style now
   */
  'aria-disabled'?: boolean
}

/**
 * A round button component that displays a centered icon.
 * It supports different color variants and sizes.
 *
 * @param {IconButtonProps} props The props for the component.
 * @returns {JSX.Element} The rendered IconButton component.
 */

// ToDo: (kk: 2022-10-04) Rename this to IconButton when remove IconButton from components
export function NewIconButton({
  variant,
  iconName,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
  onClick,
  ...restProps
}: IconButtonProps): JSX.Element {
  const colors = COLOR_VARIANTS[variant]
  const iconSize = ICON_SIZES[size]

  const buttonClassName = clsx(
    styles.icon_button,
    styles[`variant_${variant}`],
    styles[`size_${size}`]
  )

  const buttonStyle: CSSProperties = {
    // @ts-expect-error: CSS custom properties are not recognized by React.CSSProperties
    '--variant-default': colors.default,
    '--variant-active': colors.active,
    '--variant-hover': colors.hover,
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    if (ariaDisabled === true) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      type="button"
      className={buttonClassName}
      style={buttonStyle}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
      onClick={handleClick}
      {...restProps}
    >
      <Icon name={iconName} size={iconSize} color={colors.icon} />
    </button>
  )
}
