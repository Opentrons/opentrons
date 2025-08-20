import clsx from 'clsx'

import { PlaceholderStyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './deckinfolabel.module.css'

export interface DeckInfoLabelProps {
  deckLabel?: string
  iconName?: string
  highlight?: boolean
  size?: 'large' | 'default'
  height?: string | number
  width?: string | number
  svgSize?: string | number
  transform?: string
}

export function DeckInfoLabel({
  deckLabel,
  iconName,
  highlight = false,
  size = 'default',
  height,
  width,
  transform,
  svgSize,
}: DeckInfoLabelProps): JSX.Element {
  const labelClass = clsx(
    styles.label,
    highlight
      ? styles.deck_info_label_highlight
      : styles.deck_info_label_no_highlight,
    styles[size],
    {
      [styles.has_deck_label]: deckLabel != null,
    }
  )

  return (
    <div
      className={labelClass}
      style={{ height, width, transform }}
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
