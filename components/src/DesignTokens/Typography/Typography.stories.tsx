import { css } from 'styled-components'

import { PRODUCT } from '../../helix-design-system'
import { Box, Flex, Text } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN } from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { Meta, StoryObj } from '@storybook/react'
import type { FlattenSimpleInterpolation } from 'styled-components'

const fontStyles = {
  'Helix Product (Desktop)': [
    ['Display', 'Bold'],
    ['HeadingLarge', 'Regular'],
    ['HeadingLarge', 'Bold'],
    ['HeadingMedium', 'SemiBold'],
    ['HeadingSmall', 'Regular'],
    ['HeadingSmall', 'Bold'],
    ['BodyLarge', 'SemiBold'],
    ['BodyLarge', 'Regular'],
    ['BodyDefault', 'SemiBold'],
    ['BodyDefault', 'Regular'],
    ['Caption', 'Bold'],
    ['Caption', 'SemiBold'],
    ['Caption', 'Regular'],
    ['Code', 'Regular'],
  ],
  ODD: [
    ['level1Header', ''],
    ['level2Header', 'Bold'],
    ['level2Header', 'SemiBold'],
    ['level2Header', 'Regular'],
    ['level3Header', 'Bold'],
    ['level3Header', 'SemiBold'],
    ['level3Header', 'Regular'],
    ['level4Header', 'Bold'],
    ['level4Header', 'SemiBold'],
    ['level4Header', 'Regular'],
    ['bodyText', 'Bold'],
    ['bodyText', 'SemiBold'],
    ['bodyText', 'Regular'],
    ['smallBodyText', 'Bold'],
    ['smallBodyText', 'SemiBold'],
    ['smallBodyText', 'Regular'],
  ],
  'Legacy Desktop': [
    ['h1', 'Default'],
    ['h2', 'Regular'],
    ['h2', 'SemiBold'],
    ['h3', 'Regular'],
    ['h3', 'SemiBold'],
    ['h6', 'Default'],
    ['h6', 'SemiBold'],
    ['p', 'Regular'],
    ['p', 'SemiBold'],
    ['label', 'Regular'],
    ['label', 'SemiBold'],
    ['linkP', 'SemiBold'],
  ],
} as const

type TypographyStandard = keyof typeof fontStyles
type FontPair = readonly [style: string, weight: string]

interface StoryArgs {
  text: string
  styles: TypographyStandard
}

// Type guard to ensure the styles value is a valid TypographyStandard
const isValidTypographyStandard = (
  value: unknown
): value is TypographyStandard => {
  return typeof value === 'string' && value in fontStyles
}

const convertToPx = (remFormat: string): string => {
  const numeric = Number(remFormat.replace('rem', ''))
  return `${numeric * 16}px`
}

const valueFromFlattenedInterp = (
  style: FlattenSimpleInterpolation,
  valueName: string
): string => {
  const found = style.reduce<[boolean, string | null]>(
    (acc, el) => {
      const [sawKey, value] = acc
      const trimmed = String(el).trim()

      if (sawKey) {
        // next token after the key is the value we want (keep raw to preserve units)
        return [true, value ?? String(el)]
      }

      if (trimmed.includes(valueName)) {
        return [true, null]
      }

      return [false, null]
    },
    [false, null]
  )[1]

  if (found == null) return ''
  return found.trim()
}

/**
 * Helix Product (Desktop) helpers
 */
const styleForPairForHelix = (
  style: string,
  weight: string
): FlattenSimpleInterpolation => {
  const key = `fontStyle${style}${weight}` as keyof typeof PRODUCT.TYPOGRAPHY
  const fontPayload = PRODUCT.TYPOGRAPHY[key] as unknown as string
  return css`
    font: ${fontPayload};
  `
}

const fontSizeForPairForHelix = (style: string, weight: string): string => {
  const key = `fontSize${style}${weight}` as keyof typeof PRODUCT.TYPOGRAPHY
  const fontSize = PRODUCT.TYPOGRAPHY[key] as unknown as string
  const fontSizeInPx = convertToPx(fontSize)
  return `font-size: ${fontSize}/${fontSizeInPx}`
}

const lineHeightForPairForHelix = (style: string, weight: string): string => {
  const key = `lineHeight${style}${weight}` as keyof typeof PRODUCT.TYPOGRAPHY
  const lineHeight = PRODUCT.TYPOGRAPHY[key] as unknown as string
  const lineHeightInPx = convertToPx(lineHeight)
  return `line-height: ${lineHeight}/${lineHeightInPx}`
}

const fontWeightForPairForHelix = (style: string, weight: string): string => {
  const key = `fontWeight${style}${weight}` as keyof typeof PRODUCT.TYPOGRAPHY
  const fontWeight = PRODUCT.TYPOGRAPHY[key] as unknown as string | number
  return `font-weight: ${fontWeight}`
}

/**
 * Legacy helpers (TYPOGRAPHY is FlattenSimpleInterpolation)
 */
const styleForPairForLegacy = (
  style: string,
  weight: string
): FlattenSimpleInterpolation => {
  const key = `${style}${weight}` as keyof typeof TYPOGRAPHY
  return TYPOGRAPHY[key] as unknown as FlattenSimpleInterpolation
}

const fontSizeForPairForLegacy = (style: string, weight: string): string => {
  const stylePayload = styleForPairForLegacy(style, weight)
  const sizeStr = valueFromFlattenedInterp(stylePayload, 'font-size:')
  const sizeInPx = sizeStr !== '' ? convertToPx(sizeStr) : ''
  return sizeStr !== ''
    ? `font-size: ${sizeStr}/${sizeInPx}`
    : 'font-size: (unknown)'
}

const lineHeightForPairForLegacy = (style: string, weight: string): string => {
  const stylePayload = styleForPairForLegacy(style, weight)
  const lhStr = valueFromFlattenedInterp(stylePayload, 'line-height:')
  const lhInPx = lhStr !== '' ? convertToPx(lhStr) : ''
  return lhStr !== ''
    ? `line-height: ${lhStr}/${lhInPx}`
    : 'line-height: (unknown)'
}

const fontWeightForPairForLegacy = (style: string, weight: string): string => {
  const stylePayload = styleForPairForLegacy(style, weight)
  const fw = valueFromFlattenedInterp(stylePayload, 'font-weight:')
  return fw !== '' ? `font-weight: ${fw}` : 'font-weight: (unknown)'
}

/**
 * Unified selectors
 */
const styleForPair = (
  style: string,
  weight: string,
  which: TypographyStandard
): FlattenSimpleInterpolation =>
  which === 'Helix Product (Desktop)'
    ? styleForPairForHelix(style, weight)
    : styleForPairForLegacy(style, weight)

const fontSizeForPair = (
  style: string,
  weight: string,
  which: TypographyStandard
): string =>
  which === 'Helix Product (Desktop)'
    ? fontSizeForPairForHelix(style, weight)
    : fontSizeForPairForLegacy(style, weight)

const lineHeightForPair = (
  style: string,
  weight: string,
  which: TypographyStandard
): string =>
  which === 'Helix Product (Desktop)'
    ? lineHeightForPairForHelix(style, weight)
    : lineHeightForPairForLegacy(style, weight)

const fontWeightForPair = (
  style: string,
  weight: string,
  which: TypographyStandard
): string =>
  which === 'Helix Product (Desktop)'
    ? fontWeightForPairForHelix(style, weight)
    : fontWeightForPairForLegacy(style, weight)

const meta: Meta<StoryArgs> = {
  title: 'Design Tokens/Typography',
  argTypes: {
    text: { control: 'text' },
    styles: {
      control: { type: 'select' },
      options: Object.keys(fontStyles) as TypographyStandard[],
    },
  },
}
export default meta

export const AllTypographyStyles: StoryObj<StoryArgs> = {
  args: {
    text: 'The quick brown fox jumped over the lazy dog.',
    styles: 'Helix Product (Desktop)',
  },
  render: (args: StoryArgs) => {
    if (!isValidTypographyStandard(args.styles)) {
      return <div>Invalid typography standard</div>
    }

    const which = args.styles
    const fonts = fontStyles[which] as readonly FontPair[]

    return (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        padding={SPACING.spacing24}
      >
        {fonts.map(([style, weight]) => (
          <Box key={`${style}_${weight}`} alignItems={ALIGN_CENTER}>
            <Text css={styleForPair(style, weight, which)}>
              {`${style} ${weight} (${fontWeightForPair(
                style,
                weight,
                which
              )}, ${fontSizeForPair(style, weight, which)}, ${lineHeightForPair(
                style,
                weight,
                which
              )}): ${args.text}`}
            </Text>
          </Box>
        ))}
      </Flex>
    )
  },
}
