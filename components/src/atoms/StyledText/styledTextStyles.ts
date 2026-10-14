import clsx from 'clsx'

import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../helix-design-system/product'
import { TYPOGRAPHY } from '../../ui-style-constants'

import styles from './styledtext.module.css'

import type { CSSProperties } from 'react'

/**
 * Desktop styles use Helix product typography (`fontStyle*` strings).
 * Applied via --styled-text-desktop-font on the desktop viewport only.
 */
const helixFontStyleMap = {
  displayBold: HELIX_TYPOGRAPHY.fontStyleDisplayBold,
  headingLargeRegular: HELIX_TYPOGRAPHY.fontStyleHeadingLargeRegular,
  headingLargeBold: HELIX_TYPOGRAPHY.fontStyleHeadingLargeBold,
  headingMediumBold: HELIX_TYPOGRAPHY.fontStyleHeadingMediumBold,
  headingMediumSemiBold: HELIX_TYPOGRAPHY.fontStyleHeadingMediumSemiBold,
  headingSmallRegular: HELIX_TYPOGRAPHY.fontStyleHeadingSmallRegular,
  headingSmallBold: HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold,
  // Prior styled-components map used Bold here; keep parity.
  headingSmallSemiBold: HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold,
  bodyLargeSemiBold: HELIX_TYPOGRAPHY.fontStyleBodyLargeSemiBold,
  bodyLargeRegular: HELIX_TYPOGRAPHY.fontStyleBodyLargeRegular,
  bodyDefaultSemiBold: HELIX_TYPOGRAPHY.fontStyleBodyDefaultSemiBold,
  bodyDefaultRegular: HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
  bodyDefaultRegLink: HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
  captionSemiBold: HELIX_TYPOGRAPHY.fontStyleCaptionSemiBold,
  captionBold: HELIX_TYPOGRAPHY.fontStyleCaptionBold,
  captionRegular: HELIX_TYPOGRAPHY.fontStyleCaptionRegular,
  codeRegular: HELIX_TYPOGRAPHY.fontStyleCodeRegular,
  codeBold: HELIX_TYPOGRAPHY.fontStyleCodeBold,
  hidden: null,
} as const

type OddTypographyTokens = {
  fontSize: string
  lineHeight: string
  fontWeight?: number
}

/**
 * ODD styles use ui-style-constants TYPOGRAPHY tokens
 * (level*Header / bodyText* / smallBodyText*).
 */
const ODDStyleMap = {
  level1Header: {
    fontSize: TYPOGRAPHY.fontSize80,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    lineHeight: TYPOGRAPHY.lineHeight96,
  },
  level2HeaderRegular: {
    fontSize: TYPOGRAPHY.fontSize38,
    fontWeight: TYPOGRAPHY.fontWeightRegular,
    lineHeight: TYPOGRAPHY.lineHeight48,
  },
  level2HeaderSemiBold: {
    fontSize: TYPOGRAPHY.fontSize38,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    lineHeight: TYPOGRAPHY.lineHeight48,
  },
  level2HeaderBold: {
    fontSize: TYPOGRAPHY.fontSize38,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    lineHeight: TYPOGRAPHY.lineHeight48,
  },
  level3HeaderRegular: {
    fontSize: TYPOGRAPHY.fontSize32,
    fontWeight: TYPOGRAPHY.fontWeightRegular,
    lineHeight: TYPOGRAPHY.lineHeight42,
  },
  level3HeaderSemiBold: {
    fontSize: TYPOGRAPHY.fontSize32,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    lineHeight: TYPOGRAPHY.lineHeight42,
  },
  level3HeaderBold: {
    fontSize: TYPOGRAPHY.fontSize32,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    lineHeight: TYPOGRAPHY.lineHeight42,
  },
  level4HeaderRegular: {
    fontSize: TYPOGRAPHY.fontSize28,
    fontWeight: TYPOGRAPHY.fontWeightRegular,
    lineHeight: TYPOGRAPHY.lineHeight36,
  },
  level4HeaderSemiBold: {
    fontSize: TYPOGRAPHY.fontSize28,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    lineHeight: TYPOGRAPHY.lineHeight36,
  },
  level4HeaderBold: {
    fontSize: TYPOGRAPHY.fontSize28,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    lineHeight: TYPOGRAPHY.lineHeight36,
  },
  bodyTextRegular: {
    fontSize: TYPOGRAPHY.fontSize22,
    fontWeight: TYPOGRAPHY.fontWeightRegular,
    lineHeight: TYPOGRAPHY.lineHeight28,
  },
  bodyTextSemiBold: {
    fontSize: TYPOGRAPHY.fontSize22,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    lineHeight: TYPOGRAPHY.lineHeight28,
  },
  bodyTextBold: {
    fontSize: TYPOGRAPHY.fontSize22,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    lineHeight: TYPOGRAPHY.lineHeight28,
  },
  smallBodyTextRegular: {
    fontSize: TYPOGRAPHY.fontSize20,
    fontWeight: TYPOGRAPHY.fontWeightRegular,
    lineHeight: TYPOGRAPHY.lineHeight24,
  },
  // Prior styled-components map only set size/line-height (no font-weight).
  smallBodyTextSemiBold: {
    fontSize: TYPOGRAPHY.fontSize20,
    lineHeight: TYPOGRAPHY.lineHeight24,
  },
  smallBodyTextBold: {
    fontSize: TYPOGRAPHY.fontSize20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    lineHeight: TYPOGRAPHY.lineHeight24,
  },
  hidden: null,
} as const satisfies Record<string, OddTypographyTokens | null>
