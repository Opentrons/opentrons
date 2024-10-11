import {
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Design Tokens/Colors',
} as Meta

interface ColorsStorybookProps {
  colors: string[]
}

const Template: Story<ColorsStorybookProps> = args => {
  const targetColors = args.colors
  const colorCategories = targetColors.reduce((acc, color) => {
    const match = color[0].match(/[a-zA-Z]+/)
    const category = match?.[0]
    if (category) {
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(color)
    }
    return acc
  }, {})

  const invertColor = (hex: string): string => {
    if (hex.indexOf('#') === 0) {
      hex = hex.slice(1)
    }

    if (hex.length !== 6) {
      hex = hex.slice(0, 6)
    }
    const r = (255 - parseInt(hex.slice(0, 2), 16))
      .toString(16)
      .padStart(2, '0')
    const g = (255 - parseInt(hex.slice(2, 4), 16))
      .toString(16)
      .padStart(2, '0')
    const b = (255 - parseInt(hex.slice(4, 6), 16))
      .toString(16)
      .padStart(2, '0')
    return `#${r}${g}${b}`
  }

  return (
    <Flex flexDirection={DIRECTION_ROW} padding={SPACING.spacing16}>
      {Object.entries(colorCategories).map(([category, colors], index) => (
        <Flex key={`category_${index}`} flexDirection={DIRECTION_COLUMN}>
          {colors.map((color, colorIndex) => (
            <Flex
              className={`color_${colorIndex}`}
              key={`color_${colorIndex}`}
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_FLEX_START}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              backgroundColor={color[1]}
              padding={SPACING.spacing40}
              width="12rem"
              height="12rem"
              margin={SPACING.spacing2} // Add some margin between color rows
              borderRadius={BORDERS.borderRadius4}
              style={{
                cursor: CURSOR_POINTER,
                border: `1px solid ${COLORS.grey20}`,
              }}
            >
              <LegacyStyledText
                color={invertColor(color[1] as string)}
                fontSize={TYPOGRAPHY.fontSizeP}
                fontWeight={TYPOGRAPHY.fontWeightBold}
              >
                {color[0]}
              </LegacyStyledText>
              <LegacyStyledText
                fontSize={TYPOGRAPHY.fontSizeP}
                color={invertColor(color[1] as string)}
                fontWeight={TYPOGRAPHY.fontWeightRegular}
              >
                {color[1]}
              </LegacyStyledText>
            </Flex>
          ))}
        </Flex>
      ))}
    </Flex>
  )
}

export const AllColors = Template.bind({})
const order = [
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
]

const filteredColors = Object.entries(COLORS).filter(([key]) =>
  order.some(color => key.toLowerCase().includes(color))
)

const sortedColors = filteredColors.sort((a, b) => {
  const aOrder = order.findIndex(color => a[0].toLowerCase().includes(color))
  const bOrder = order.findIndex(color => b[0].toLowerCase().includes(color))
  const aMatch = a[0].match(/\d+/)
  const bMatch = b[0].match(/\d+/)
  const aNumber = aMatch ? parseInt(aMatch[0], 10) : 0
  const bNumber = bMatch ? parseInt(bMatch[0], 10) : 0
  return aOrder - bOrder || bNumber - aNumber
})

console.table(sortedColors)

AllColors.args = {
  colors: sortedColors,
}
