// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

import {
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { Meta, StoryFn } from '@storybook/react'

export default {
  title: 'Design Tokens/BorderRadius',
} as Meta

interface BorderRadiusStorybookProps {
  borderRadius: Array<[string, string]>
}

const Template: StoryFn<BorderRadiusStorybookProps> = args => {
  const targetBorderRadiuses = args.borderRadius
    .filter(
      (s): s is [string, string] =>
        typeof s[0] === 'string' && s[0].includes('borderRadius')
    )
    .sort((a, b) => {
      const aValue = parseInt(String(a[1]), 10)
      const bValue = parseInt(String(b[1]), 10)
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
          <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {`${br[0]}" ${br[1]}`}
          </LegacyStyledText>
          <Box
            width="10rem"
            height="4rem"
            backgroundColor={COLORS.blue50}
            borderRadius={String(br[1])}
          />
        </Flex>
      ))}
    </Flex>
  )
}

export const AllBorderRadiuses = Template.bind({})
const allBorderRadiuses = Object.entries(BORDERS) as Array<[string, string]>
AllBorderRadiuses.args = {
  borderRadius: allBorderRadiuses,
}
