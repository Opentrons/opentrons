import clsx from 'clsx'

import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../helix-design-system/product'
import { TYPOGRAPHY } from '../../ui-style-constants'
import styles from './styledtext.module.css'

import type { CSSProperties } from 'react'

interface DesktopStyleEntry {
  as: keyof JSX.IntrinsicElements
  font: string | null
}

interface OddTypographyTokens {
  fontSize: string
  lineHeight: string
  fontWeight?: number
}

interface OddStyleEntry {
  as: keyof JSX.IntrinsicElements
  tokens: OddTypographyTokens | null
}

/**
 * Desktop styles — Helix font string + semantic tag.
 */
const desktopStyleMap = {
  displayBold: {
    as: 'h1',
    font: HELIX_TYPOGRAPHY.fontStyleDisplayBold,
  },
  headingLargeRegular: {
    as: 'h2',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingLargeRegular,
  },
  headingLargeBold: {
    as: 'h2',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingLargeBold,
  },
  headingMediumBold: {
    as: 'h3',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingMediumBold,
  },
  headingMediumSemiBold: {
    as: 'h3',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingMediumSemiBold,
  },
  headingSmallRegular: {
    as: 'h4',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingSmallRegular,
  },
  headingSmallBold: {
    as: 'h4',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold,
  },
  // Prior styled-components map used Bold here; keep parity.
  headingSmallSemiBold: {
    as: 'h4',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold,
  },
  bodyLargeSemiBold: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleBodyLargeSemiBold,
  },
  bodyLargeRegular: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleBodyLargeRegular,
  },
  bodyDefaultSemiBold: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleBodyDefaultSemiBold,
  },
  bodyDefaultRegular: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
  },
  bodyDefaultRegLink: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
  },
  captionSemiBold: {
    as: 'label',
    font: HELIX_TYPOGRAPHY.fontStyleCaptionSemiBold,
  },
  captionBold: {
    as: 'label',
    font: HELIX_TYPOGRAPHY.fontStyleCaptionBold,
  },
  captionRegular: {
    as: 'label',
    font: HELIX_TYPOGRAPHY.fontStyleCaptionRegular,
  },
  codeRegular: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleCodeRegular,
  },
  codeBold: {
    as: 'p',
    font: HELIX_TYPOGRAPHY.fontStyleCodeBold,
  },
  hidden: {
    as: 'p',
    font: null,
  },
} as const satisfies Record<string, DesktopStyleEntry>

/**
 * ODD styles — typography tokens + semantic tag.
 */
const ODDStyleMap = {
  level1Header: {
    as: 'h1',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize80,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight96,
    },
  },
  level2HeaderRegular: {
    as: 'h2',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize38,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight48,
    },
  },
  level2HeaderSemiBold: {
    as: 'h2',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize38,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight48,
    },
  },
  level2HeaderBold: {
    as: 'h2',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize38,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight48,
    },
  },
  level3HeaderRegular: {
    as: 'h3',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize32,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight42,
    },
  },
  level3HeaderSemiBold: {
    as: 'h3',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize32,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight42,
    },
  },
  level3HeaderBold: {
    as: 'h3',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize32,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight42,
    },
  },
  level4HeaderRegular: {
    as: 'h4',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize28,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight36,
    },
  },
  level4HeaderSemiBold: {
    as: 'h4',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize28,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight36,
    },
  },
  level4HeaderBold: {
    as: 'h4',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize28,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight36,
    },
  },
  bodyTextRegular: {
    as: 'p',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize22,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight28,
    },
  },
  bodyTextSemiBold: {
    as: 'p',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize22,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight28,
    },
  },
  bodyTextBold: {
    as: 'p',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize22,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight28,
    },
  },
  smallBodyTextRegular: {
    as: 'label',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize20,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight24,
    },
  },
  // Prior styled-components map only set size/line-height (no font-weight).
  smallBodyTextSemiBold: {
    as: 'label',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize20,
      lineHeight: TYPOGRAPHY.lineHeight24,
    },
  },
  smallBodyTextBold: {
    as: 'label',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize20,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight24,
    },
  },
  hidden: {
    as: 'p',
    tokens: null,
  },
} as const satisfies Record<string, OddStyleEntry>

export type DesktopStyles = keyof typeof desktopStyleMap
export type ODDStyles = keyof typeof ODDStyleMap

export const DESKTOP_STYLES: Array<DesktopStyles> = Object.keys(
  desktopStyleMap
) as Array<DesktopStyles>

export const ODD_STYLES: Array<ODDStyles> = Object.keys(
  ODDStyleMap
) as Array<ODDStyles>

/** Extra CSS-module classes beyond the Desktop / ODD font tokens. */
const desktopExtraClassMap: Partial<Record<DesktopStyles, string>> = {
  bodyDefaultRegLink: styles.desktop_underline,
  codeBold: styles.desktop_code_bold_color,
  hidden: styles.desktop_hidden,
}

const oddExtraClassMap: Partial<Record<ODDStyles, string>> = {
  hidden: styles.odd_hidden,
}

function oddTypographyToStyle(tokens: OddTypographyTokens): CSSProperties {
  const style = {
    '--odd-font-size': tokens.fontSize,
    '--odd-line-height': tokens.lineHeight,
  } as CSSProperties

  if (tokens.fontWeight != null) {
    ;(style as Record<string, string | number>)['--odd-font-weight'] =
      tokens.fontWeight
  }

  return style
}

function resolveStyledTextClassName({
  desktopStyle,
  oddStyle,
  desktopFont,
  oddTokens,
}: {
  desktopStyle?: DesktopStyles
  oddStyle?: ODDStyles
  desktopFont: string | null
  oddTokens: OddTypographyTokens | null
}): string {
  return clsx(
    desktopFont != null ? styles.desktop_helix_font : null,
    desktopStyle != null ? desktopExtraClassMap[desktopStyle] : null,
    oddTokens != null ? styles.odd_style : null,
    oddStyle != null ? oddExtraClassMap[oddStyle] : null
  )
}

/**
 * Resolve the semantic tag from style maps.
 */
export function resolveStyledTextTag({
  desktopStyle,
  oddStyle,
}: {
  desktopStyle?: DesktopStyles
  oddStyle?: ODDStyles
}): keyof JSX.IntrinsicElements {
  if (desktopStyle != null) {
    return desktopStyleMap[desktopStyle].as
  }
  if (oddStyle != null) {
    return ODDStyleMap[oddStyle].as
  }
  return 'p'
}

export function resolveStyledTextStyles({
  desktopStyle,
  oddStyle,
}: {
  desktopStyle?: DesktopStyles
  oddStyle?: ODDStyles
}): { className: string; style?: CSSProperties } {
  const desktopFont =
    desktopStyle != null ? desktopStyleMap[desktopStyle].font : null
  const oddTokens = oddStyle != null ? ODDStyleMap[oddStyle].tokens : null

  const className = resolveStyledTextClassName({
    desktopStyle,
    oddStyle,
    desktopFont,
    oddTokens,
  })

  const style: CSSProperties = {
    ...(desktopFont != null
      ? ({ '--helix-font': desktopFont } as CSSProperties)
      : null),
    ...(oddTokens != null ? oddTypographyToStyle(oddTokens) : null),
  }

  return {
    className,
    style: Object.keys(style).length > 0 ? style : undefined,
  }
}
