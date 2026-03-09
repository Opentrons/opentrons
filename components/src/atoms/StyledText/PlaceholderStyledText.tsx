import clsx from 'clsx'

import styles from './placeholderstyledtext.module.css'

import type { ReactNode } from 'react'

type StyleKey =
  | 'headingSmallBold'
  | 'captionBold'
  | 'bodyDefaultSemiBold'
  | 'smallBodyTextBold'

interface PlaceholderStyledTextProps {
  children: ReactNode
  color?: string
  desktopStyle?: string
  oddStyle?: string
}

/**
 * @deprecated: NOTE: YOU SHOULD NOT BE USING THIS - THIS IS A TEMP COMPONENT
 * USED FOR PROTOCOL LIBRARY TO NOT USE STYLED-COMPONENTS. USE THIS
 * UNTIL WE MIGRATE STYLEDTEXT PROPERLY
 */
export const PlaceholderStyledText = (
  props: PlaceholderStyledTextProps
): JSX.Element => {
  const { children, color, desktopStyle, oddStyle } = props

  const styleMap: Record<StyleKey, string> = {
    headingSmallBold: styles.heading_small_bold,
    captionBold: styles.caption_bold,
    bodyDefaultSemiBold: styles.body_default_semi_bold,
    smallBodyTextBold: styles.small_body_text_bold,
  }
  const combinedClassName = clsx(
    desktopStyle != null ? styleMap[desktopStyle as StyleKey] : null,
    oddStyle != null ? styleMap[oddStyle as StyleKey] : null
  )
  return (
    <text className={combinedClassName} style={{ color: color ?? '' }}>
      {children}
    </text>
  )
}
