import * as React from 'react'
import {
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

import { StyledText } from '../../atoms/text'

export default {
  title: 'Design Tokens/Colors',
} as Meta

interface ColorsStorybookProps {
  colors: string[]
}

const Template: Story<ColorsStorybookProps> = args => {
  const targetColors = args.colors.filter(
    c => (!c[0].includes('opacity') || c.length > 2) && typeof c[1] === 'string'
  )

  const [copiedColor, setCopiedColor] = React.useState<string | null>(null)

  const invertColor = (hex: string): string => {
    if (hex.indexOf('#') === 0) {
      hex = hex.slice(1)
    }

    if (hex.length !== 6) {
      hex = hex.slice(0, 6)
    }
    // hex = hex.toUpperCase()
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

  const handleClick = (colorName: string): void => {
    navigator.clipboard.writeText(`COLORS.${colorName}`)
    setCopiedColor(colorName)
    setTimeout(() => {
      setCopiedColor(null)
    }, 2000)
  }

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      flexWrap="wrap"
      padding={SPACING.spacing24}
    >
      {targetColors.map((color, index) => (
        <Flex
          key={`color_${index}`}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          backgroundColor={color[1]}
          padding={SPACING.spacing16}
          gridGap={SPACING.spacing4}
          width="20rem"
          height="6rem"
          borderRadius={BORDERS.borderRadiusSize2}
          onClick={() => handleClick(color[0])}
          style={{ cursor: 'pointer' }}
          border={`2px solid ${COLORS.darkBlackEnabled}`}
        >
          <StyledText
            color={invertColor(color[1])}
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {color[0]}
          </StyledText>
          <StyledText
            as="p"
            color={invertColor(color[1])}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {color[1]}
          </StyledText>
          <Flex height="1rem">
            {copiedColor === color[0] ? (
              <StyledText as="p" color={invertColor(color[1])}>
                {'copied'}
              </StyledText>
            ) : null}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}

export const AllColors = Template.bind({})
const allColors = Object.entries(COLORS)
AllColors.args = {
  colors: allColors,
}
