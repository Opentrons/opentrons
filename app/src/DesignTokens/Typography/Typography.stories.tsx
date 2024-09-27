import { css } from 'styled-components'
import type { FlattenSimpleInterpolation } from 'styled-components'
import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  Text,
  PRODUCT,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

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
}

type TypographyStandard = keyof typeof fontStyles

export default {
  title: 'Design Tokens/Typography',
  argTypes: {
    text: {
      type: 'text',
    },
    styles: {
      control: {
        type: 'select',
      },
      options: Object.keys(fontStyles),
    },
  },
} as Meta

interface TypographyStorybookProps {
  text: string
  styles: TypographyStandard
}

const convertToPx = (remFormat: string): string => {
  const pxVal = Number(remFormat.replace('rem', '')) * 16
  return `${pxVal}px`
}
const styleForPairForHelix = (style: string, weight: string): string => {
  const fontPayload = PRODUCT.TYPOGRAPHY[`fontStyle${style}${weight}`]
  return css`
    font: ${fontPayload};
  `
}
const fontSizeForPairForHelix = (style: string, weight: string): string => {
  const fontSize = PRODUCT.TYPOGRAPHY[`fontSize${style}${weight}`] as string
  const fontSizeInPx = convertToPx(fontSize)
  return `font-size: ${fontSize}/${fontSizeInPx}`
}
const lineHeightForPairForHelix = (style: string, weight: string): string => {
  const lineHeight = PRODUCT.TYPOGRAPHY[`lineHeight${style}${weight}`] as string
  const lineHeightInPx = convertToPx(lineHeight)
  return `line-height: ${lineHeight}/${lineHeightInPx}`
}
const fontWeightForPairForHelix = (style: string, weight: string): string => {
  const fontWeight = PRODUCT.TYPOGRAPHY[`fontWeight${style}${weight}`]
  return `font-weight: ${fontWeight}`
}

const styleForPairForLegacy = (style: string, weight: string): string => {
  return TYPOGRAPHY[`${style}${weight}`]
}

const fontSizeForPairForLegacy = (style: string, weight: string): string => {
  const stylePayload = styleForPairForLegacy(style, weight)
  const sizeStr = valueFromFlattenedInterp(stylePayload, 'font-size:')
  const sizeInPx = convertToPx(sizeStr)

  return `font-size: ${sizeStr}/${sizeInPx}`
}

const lineHeightForPairForLegacy = (style: string, weight: string): string => {
  const stylePayload = styleForPairForLegacy(style, weight)
  const sizeStr = valueFromFlattenedInterp(stylePayload, 'line-height:')
  const sizeInPx = convertToPx(sizeStr)
  return `line-height: ${sizeStr}/${sizeInPx}`
}

const fontWeightForPairForLegacy = (style: string, weight: string): string => {
  const stylePayload = styleForPairForLegacy(style, weight)
  const fontWeight = valueFromFlattenedInterp(stylePayload, 'font-weight:')
  return `font-weight: ${fontWeight}`
}

const valueFromFlattenedInterp = (
  style: FlattenSimpleInterpolation,
  valueName: str
): string => {
  return style.reduce(
    ([sawKey, value]: [boolean, null | string], el) => {
      const thisEl = el.trim()
      if (sawKey && value == null) {
        return [sawKey, el]
      }
      if (sawKey && value != null) {
        return [sawKey, value]
      }
      if (thisEl.includes(valueName)) {
        return [true, null]
      }
      return [false, null]
    },
    [false, null]
  )[1]
}

const styleForPair = (
  style: string,
  weight: string,
  which: TypographyStandard
): string =>
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

const Template: Story<TypographyStorybookProps> = args => {
  const fonts = fontStyles[args.styles]
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing24}
    >
      {fonts.map(([style, weight]) => (
        <Box key={`${style}_${weight}`} alignItems={ALIGN_CENTER}>
          <Text css={styleForPair(style, weight, args.styles)}>
            {`${style} ${weight} (${fontWeightForPair(
              style,
              weight,
              args.styles
            )}, ${fontSizeForPair(
              style,
              weight,
              args.styles
            )}, ${lineHeightForPair(style, weight, args.styles)}): ${
              args.text
            }`}
          </Text>
        </Box>
      ))}
    </Flex>
  )
}

export const AllTypographyStyles = Template.bind({})
AllTypographyStyles.args = {
  text: 'The quick brown fox jumped over the lazy dog.',
  styles: 'Helix Product (Desktop)',
}
