import type { ReactNode } from 'react'

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

  let font
  if (desktopStyle === 'headingSmallBold') {
    font = '700 1.125rem/1.5rem Public Sans'
  } else if (desktopStyle === 'captionBold') {
    font = '700 0.8125rem/1rem Public Sans'
  } else if (desktopStyle === 'bodyDefaultSemiBold') {
    font = '600 0.875rem/1.25rem Public Sans'
  }

  const isTouchscreen = window.matchMedia('(height: 600px) and (width: 1024px)')
    .matches

  if (isTouchscreen && oddStyle === 'smallBodyTextBold') {
    font = '400 1.25rem'
  }

  return <text style={{ color: color ?? '', font }}>{children}</text>
}
