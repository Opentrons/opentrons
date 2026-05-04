import { StyledText } from '../../atoms/StyledText'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import {
  ALIGN_FLEX_START,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { Meta, StoryObj } from '@storybook/react'

type ColorEntry = [token: string, value: string]
interface StoryArgs {
  colors: ColorEntry[]
}

const meta: Meta<StoryArgs> = {
  title: 'Design Tokens/Colors',
}
export default meta

const ORDER = [
  'grey',
  'blue',
  'red',
  'purple',
  'green',
  'yellow',
  'flex',
  'black',
  'white',
  'opacity',
] as const

const invertColor = (hex: string): string => {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex
  const six =
    normalized.length >= 6 ? normalized.slice(0, 6) : normalized.padEnd(6, '0')

  const r = (255 - Number.parseInt(six.slice(0, 2), 16))
    .toString(16)
    .padStart(2, '0')
  const g = (255 - Number.parseInt(six.slice(2, 4), 16))
    .toString(16)
    .padStart(2, '0')
  const b = (255 - Number.parseInt(six.slice(4, 6), 16))
    .toString(16)
    .padStart(2, '0')

  return `#${r}${g}${b}`
}

const groupByCategory = (
  entries: ColorEntry[]
): Record<string, ColorEntry[]> => {
  return entries.reduce<Record<string, ColorEntry[]>>((acc, entry) => {
    const [token] = entry
    const category = token.match(/[a-zA-Z]+/)?.[0]
    if (!category) return acc
    ;(acc[category] ??= []).push(entry)
    return acc
  }, {})
}

const sortColors = (entries: ColorEntry[]): ColorEntry[] => {
  return [...entries].sort((a, b) => {
    const aToken = a[0].toLowerCase()
    const bToken = b[0].toLowerCase()

    const aOrder = ORDER.findIndex(c => aToken.includes(c))
    const bOrder = ORDER.findIndex(c => bToken.includes(c))

    const aNum = Number.parseInt(a[0].match(/\d+/)?.[0] ?? '0', 10)
    const bNum = Number.parseInt(b[0].match(/\d+/)?.[0] ?? '0', 10)

    // Same behavior as your original: category order first, then descending numeric shade.
    return aOrder - bOrder || bNum - aNum
  })
}

export const AllColors: StoryObj<StoryArgs> = {
  args: {
    colors: sortColors(
      (Object.entries(COLORS) as Array<[string, unknown]>)
        .filter(([key]) => ORDER.some(c => key.toLowerCase().includes(c)))
        .filter(([, value]): value is string => typeof value === 'string')
        .map(([k, v]) => [k, v])
    ),
  },
  render: args => {
    const colorCategories = groupByCategory(args.colors)

    return (
      <Flex flexDirection={DIRECTION_ROW} padding={SPACING.spacing16}>
        {Object.entries(colorCategories).map(([category, colors], index) => (
          <Flex key={`${category}_${index}`} flexDirection={DIRECTION_COLUMN}>
            {colors.map(([token, value], colorIndex) => {
              const textColor = invertColor(value)

              return (
                <Flex
                  key={`${token}_${colorIndex}`}
                  className={`color_${colorIndex}`}
                  flexDirection={DIRECTION_COLUMN}
                  alignItems={ALIGN_FLEX_START}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  backgroundColor={value}
                  padding={SPACING.spacing40}
                  width="12rem"
                  height="12rem"
                  margin={SPACING.spacing2}
                  borderRadius={BORDERS.borderRadius4}
                  style={{
                    cursor: CURSOR_POINTER,
                    border: `1px solid ${COLORS.grey20}`,
                  }}
                >
                  <StyledText
                    color={textColor}
                    fontSize={TYPOGRAPHY.fontSizeP}
                    fontWeight={TYPOGRAPHY.fontWeightBold}
                  >
                    {token}
                  </StyledText>
                  <StyledText
                    color={textColor}
                    fontSize={TYPOGRAPHY.fontSizeP}
                    fontWeight={TYPOGRAPHY.fontWeightRegular}
                  >
                    {value}
                  </StyledText>
                </Flex>
              )
            })}
          </Flex>
        ))}
      </Flex>
    )
  },
}
