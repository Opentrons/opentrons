import clsx from 'clsx'

import { StyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './deckInfoLabel.module.css'

import type { CSSProperties } from 'react'

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

  const svgStyle: CSSProperties = {
    height: svgSize ?? (size === 'large' ? '1.5rem' : '0.875rem'),
    width: svgSize ?? (size === 'large' ? '1.5rem' : '0.875rem'),
  }

  const inlineStyle: CSSProperties = {
    height,
    width,
  }

  return (
    <div
      className={labelClass}
      style={inlineStyle}
      data-testid={
        deckLabel != null
          ? `DeckInfoLabel_${deckLabel}`
          : `DeckInfoLabel_${iconName}`
      }
    >
      {iconName != null ? (
        <Icon
          name={iconName}
          style={svgStyle}
          color={highlight ? COLORS.white : COLORS.black90}
          aria-label={iconName}
        />
      ) : (
        <StyledText
          desktopStyle={size === 'large' ? 'headingSmallBold' : 'captionBold'}
          oddStyle="smallBodyTextBold"
          color={highlight ? COLORS.white : COLORS.black90}
        >
          {deckLabel}
        </StyledText>
      )}
    </div>
  )
}
