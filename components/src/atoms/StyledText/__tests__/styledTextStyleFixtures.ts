import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../../helix-design-system/product'
import { TYPOGRAPHY } from '../../../ui-style-constants'

import type { DesktopStyles, ODDStyles } from '../styledTextStyles'

export const DESKTOP_STYLE_TRANSLATIONS: Array<{
  desktopStyle: DesktopStyles
  font: string | null
}> = [
  {
    desktopStyle: 'displayBold',
    font: HELIX_TYPOGRAPHY.fontStyleDisplayBold,
  },
  {
    desktopStyle: 'headingLargeRegular',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingLargeRegular,
  },
  {
    desktopStyle: 'headingLargeBold',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingLargeBold,
  },
  {
    desktopStyle: 'headingMediumBold',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingMediumBold,
  },
  {
    desktopStyle: 'headingMediumSemiBold',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingMediumSemiBold,
  },
  {
    desktopStyle: 'headingSmallRegular',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingSmallRegular,
  },
  {
    desktopStyle: 'headingSmallBold',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold,
  },
  {
    desktopStyle: 'headingSmallSemiBold',
    font: HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold,
  },
  {
    desktopStyle: 'bodyLargeSemiBold',
    font: HELIX_TYPOGRAPHY.fontStyleBodyLargeSemiBold,
  },
  {
    desktopStyle: 'bodyLargeRegular',
    font: HELIX_TYPOGRAPHY.fontStyleBodyLargeRegular,
  },
  {
    desktopStyle: 'bodyDefaultSemiBold',
    font: HELIX_TYPOGRAPHY.fontStyleBodyDefaultSemiBold,
  },
  {
    desktopStyle: 'bodyDefaultRegular',
    font: HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
  },
  {
    desktopStyle: 'bodyDefaultRegLink',
    font: HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular,
  },
  {
    desktopStyle: 'captionSemiBold',
    font: HELIX_TYPOGRAPHY.fontStyleCaptionSemiBold,
  },
  {
    desktopStyle: 'captionBold',
    font: HELIX_TYPOGRAPHY.fontStyleCaptionBold,
  },
  {
    desktopStyle: 'captionRegular',
    font: HELIX_TYPOGRAPHY.fontStyleCaptionRegular,
  },
  {
    desktopStyle: 'codeRegular',
    font: HELIX_TYPOGRAPHY.fontStyleCodeRegular,
  },
  {
    desktopStyle: 'codeBold',
    font: HELIX_TYPOGRAPHY.fontStyleCodeBold,
  },
  {
    desktopStyle: 'hidden',
    font: null,
  },
]

export const ODD_STYLE_TRANSLATIONS: Array<{
  oddStyle: ODDStyles
  tokens: {
    fontSize: string
    lineHeight: string
    fontWeight?: number
  } | null
}> = [
  {
    oddStyle: 'level1Header',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize80,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight96,
    },
  },
  {
    oddStyle: 'level2HeaderRegular',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize38,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight48,
    },
  },
  {
    oddStyle: 'level2HeaderSemiBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize38,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight48,
    },
  },
  {
    oddStyle: 'level2HeaderBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize38,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight48,
    },
  },
  {
    oddStyle: 'level3HeaderRegular',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize32,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight42,
    },
  },
  {
    oddStyle: 'level3HeaderSemiBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize32,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight42,
    },
  },
  {
    oddStyle: 'level3HeaderBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize32,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight42,
    },
  },
  {
    oddStyle: 'level4HeaderRegular',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize28,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight36,
    },
  },
  {
    oddStyle: 'level4HeaderSemiBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize28,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight36,
    },
  },
  {
    oddStyle: 'level4HeaderBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize28,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight36,
    },
  },
  {
    oddStyle: 'bodyTextRegular',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize22,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight28,
    },
  },
  {
    oddStyle: 'bodyTextSemiBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize22,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      lineHeight: TYPOGRAPHY.lineHeight28,
    },
  },
  {
    oddStyle: 'bodyTextBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize22,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight28,
    },
  },
  {
    oddStyle: 'smallBodyTextRegular',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize20,
      fontWeight: TYPOGRAPHY.fontWeightRegular,
      lineHeight: TYPOGRAPHY.lineHeight24,
    },
  },
  {
    oddStyle: 'smallBodyTextSemiBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize20,
      lineHeight: TYPOGRAPHY.lineHeight24,
    },
  },
  {
    oddStyle: 'smallBodyTextBold',
    tokens: {
      fontSize: TYPOGRAPHY.fontSize20,
      fontWeight: TYPOGRAPHY.fontWeightBold,
      lineHeight: TYPOGRAPHY.lineHeight24,
    },
  },
  {
    oddStyle: 'hidden',
    tokens: null,
  },
]
