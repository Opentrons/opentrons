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

const Template: Story<ColorsStorybookProps[]> = args => {
  const allColors = args.colors.filter(
    c => !c[0].includes('opacity') || c.length > 2
  )

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing3}
      flexWrap="wrap"
      backgroundColor="#dadada"
      padding={SPACING.spacing5}
    >
      {allColors.map((color, index) => (
        <Flex
          key={`color_${index}`}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          backgroundColor={color[1]}
          padding={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing2}
          width="20rem"
          height="4rem"
          borderRadius={BORDERS.size_two}
        >
          <StyledText
            color="#cacaca"
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {color[0]}
          </StyledText>
          <StyledText
            as="p"
            color="#cacaca"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {color[1]}
          </StyledText>
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
