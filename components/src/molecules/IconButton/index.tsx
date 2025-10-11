import clsx from 'classnames'

import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn } from '../../primitives'
import styles from './iconbutton.module.css'

import type { CSSProperties } from 'react'
import type { IconName } from '../../icons'

/**
 * Defines the color variants available for the IconButton.
 * Can be either 'primary' or 'alert'.
 */
type Variant = 'primary' | 'alert'

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
  }
> = {
  primary: {
    default: COLORS.blue50,
    active: COLORS.blue60,
    hover: COLORS.blue55,
  },
  alert: {
    default: COLORS.red50,
    active: COLORS.red60,
    hover: COLORS.red55,
  },
}

interface IconButtonProps {
  /**
   * The color variant of the button.
   */
  variant: Variant
  /**
   * The name of the icon to be displayed.
   */
  iconName: IconName
  /**
   * The size of the icon (e.g., '16px', '2rem').
   */
  iconSize: string
  /**
   * The color of the icon.
   */
  iconColor: string
  /**
   * The size of the button (width and height).
   */
  size: string
  /**
   * The function to call when the button is clicked.
   */
  onClick: () => void
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
  iconSize,
  iconColor,
  size,
  onClick,
}: IconButtonProps): JSX.Element {
  const colors = COLOR_VARIANTS[variant]

  const buttonClassName = clsx(styles.icon_button, styles[`variant_${variant}`])

  const buttonStyle: Record<string, string> = {
    '--variant-default': colors.default, // color for background and outline
    '--variant-active': colors.active, // color for background when clicked
    '--variant-hover': colors.hover, // color for background when hovered
  }

  return (
    <Btn
      className={buttonClassName}
      onClick={onClick}
      backgroundColor={colors.default}
      width={size}
      height={size}
      style={buttonStyle}
    >
      <Icon name={iconName} size={iconSize} color={iconColor} />
    </Btn>
  )
}
