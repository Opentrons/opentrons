import clsx from 'clsx'

import { PlaceholderStyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './robotinfolabel.module.css'

import type { ReactNode } from 'react'
import type { HelixStyles } from '../../atoms/StyledText'
import type { IconName } from '../../icons'

export interface RobotInfoLabelProps {
  deckLabel?: string
  iconName?: IconName
  highlight?: boolean
  size?: 'large' | 'default' | 'extraLarge'
  height?: string | number
  width?: string | number
  svgSize?: string | number
  transform?: string
}

export function RobotInfoLabel({
  deckLabel,
  iconName,
  highlight = false,
  size = 'default',
  height,
  width,
  transform,
  svgSize,
}: RobotInfoLabelProps): ReactNode {
  const labelClass = clsx(
    styles.label,
    highlight
      ? styles.robot_info_label_highlight
      : styles.robot_info_label_no_highlight,
    styles[size],
    {
      [styles.has_deck_label]: deckLabel != null,
    }
  )
  const getTextSize = (size: string): HelixStyles => {
    switch (size) {
      case 'large':
        return 'headingSmallBold'
      case 'extraLarge':
        return 'headingLargeBold'
      default:
        return 'captionBold'
    }
  }

  return (
    <div
      className={labelClass}
      style={{ height, width, transform }}
      data-testid={
        deckLabel != null
          ? `RobotInfoLabel_${deckLabel}`
          : `RobotInfoLabel_${iconName}`
      }
    >
      {iconName != null ? (
        <Icon
          name={iconName}
          height={svgSize ?? (size === 'large' ? '1.5rem' : '0.875rem')}
          width={svgSize ?? (size === 'large' ? '1.5rem' : '0.875rem')}
          color={highlight ? COLORS.white : COLORS.black90}
          aria-label={iconName}
        />
      ) : (
        <PlaceholderStyledText
          desktopStyle={getTextSize(size)}
          oddStyle="smallBodyTextBold"
          color={highlight ? COLORS.white : COLORS.black90}
        >
          {deckLabel}
        </PlaceholderStyledText>
      )}
    </div>
  )
}
