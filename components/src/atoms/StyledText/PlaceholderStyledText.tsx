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
  return <text style={{ color: color ?? '' }}>{children}</text>
}
// desktop style = headingSmallBold, captionBold
//    oddStyle="smallBodyTextBold"
