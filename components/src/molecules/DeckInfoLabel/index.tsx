import clsx from 'clsx'

import { PlaceholderStyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './deckInfoLabel.module.css'

interface DeckInfoLabelProps {
  deckLabel?: string
  iconName?: string
  highlight?: boolean
  size?: 'large' | 'default'
  height?: string | number
  width?: string | number
  svgSize?: string | number
}

export function DeckInfoLabel({
  deckLabel,
  iconName,
  highlight = false,
  size = 'default',
  height,
  width,
  svgSize,
}: DeckInfoLabelProps): JSX.Element {
  const labelClass = clsx(
    styles.label,
    highlight ? styles.highlight : styles.noHighlight,
    styles[size],
    {
      [styles.hasDeckLabel]: deckLabel != null,
    }
  )

  return (
    <div
      className={labelClass}
      style={{ height, width }}
      data-testid={
        deckLabel != null
          ? `DeckInfoLabel_${deckLabel}`
          : `DeckInfoLabel_${iconName}`
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
          desktopStyle={size === 'large' ? 'headingSmallBold' : 'captionBold'}
          oddStyle="smallBodyTextBold"
          color={highlight ? COLORS.white : COLORS.black90}
        >
          {deckLabel}
        </PlaceholderStyledText>
      )}
    </div>
  )
}
