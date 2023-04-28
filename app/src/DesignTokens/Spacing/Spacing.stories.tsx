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
  Box,
  JUSTIFY_FLEX_START,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

import { StyledText } from '../../atoms/text'

export default {
  title: 'Design Tokens/Spacing',
} as Meta

interface SpacingsStorybookProps {
  spacings: string[]
}

const Template: Story<SpacingsStorybookProps> = args => {
  const targetSpacings = args.spacings.filter(s => !s[1].includes('auto'))

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing3}
      padding={SPACING.spacing5}
    >
      {targetSpacings.map((spacing, index) => (
        <Flex
          key={`spacing_${index}`}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_FLEX_START}
          padding={SPACING.spacing4}
          gridGap={SPACING.spacing3}
          width="100%"
          height="6rem"
        >
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {`${spacing[0]} - ${spacing[1]}`}
          </StyledText>
          <Box
            width={spacing[1]}
            height="2rem"
            backgroundColor={COLORS.blueEnabled}
          />
        </Flex>
      ))}
    </Flex>
  )
}

export const AllSpacing = Template.bind({})
const allSpacings = Object.entries(SPACING)
AllSpacing.args = {
  spacings: allSpacings,
}
