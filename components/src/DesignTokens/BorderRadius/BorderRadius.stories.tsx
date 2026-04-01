import { StyledText } from '../../atoms/StyledText'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Box, Flex } from '../../primitives'
import { ALIGN_FLEX_START, DIRECTION_COLUMN } from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { Meta, Story } from '@storybook/react'

export default {
  title: 'Design Tokens/BorderRadius',
} as Meta

interface BorderRadiusStorybookProps {
  borderRadius: string[]
}

const Template: Story<BorderRadiusStorybookProps> = args => {
  const targetBorderRadiuses = args.borderRadius
    .filter(s => s[0].includes('borderRadius'))
    .sort((a, b) => {
      const aValue = parseInt(a[1])
      const bValue = parseInt(b[1])
      return aValue - bValue
    })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing24}
    >
      {targetBorderRadiuses.map((br, index) => (
        <Flex
          key={`spacing_${index}`}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_FLEX_START}
          padding={SPACING.spacing16}
          gridGap={SPACING.spacing8}
          width="100%"
          height="6rem"
        >
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {`${br[0]}" ${br[1]}`}
          </StyledText>
          <Box
            width="10rem"
            height="4rem"
            backgroundColor={COLORS.blue50}
            borderRadius={br[1]}
          />
        </Flex>
      ))}
    </Flex>
  )
}

export const AllBorderRadiuses = Template.bind({})
const allBorderRadiuses = Object.entries(BORDERS)
AllBorderRadiuses.args = {
  borderRadius: allBorderRadiuses,
}
