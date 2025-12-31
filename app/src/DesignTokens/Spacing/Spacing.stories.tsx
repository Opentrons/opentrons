// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

import {
  ALIGN_FLEX_START,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import styles from './spacing.stories.module.css'

import type { Meta, Story } from '@storybook/react'

export default {
  title: 'Design Tokens/Spacing',
} as Meta

interface SpacingsStorybookProps {
  spacings: string[]
}

const Template: Story<SpacingsStorybookProps> = args => {
  const targetSpacings = args.spacings.filter(s => !s[1].includes('auto'))
  // sort by rem value
  const sortedSpacing = targetSpacings.sort((a, b) => {
    const aValue = parseFloat(a[1].replace('rem', ''))
    const bValue = parseFloat(b[1].replace('rem', ''))
    return aValue - bValue
  })

  const convertToPx = (remFormat: string): string => {
    const pxVal = Number(remFormat.replace('rem', '')) * 16
    return `${pxVal}px`
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing24}
    >
      {sortedSpacing.map((spacing, index) => (
        <Flex
          key={`spacing_${index}`}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_FLEX_START}
          padding={SPACING.spacing16}
          gridGap={SPACING.spacing8}
          width="100%"
          height="6rem"
        >
          <StyledText desktopStyle="bodyLargeSemiBold">
            {`${spacing[0]} - ${spacing[1]}: ${convertToPx(spacing[1])}`}
          </StyledText>
          <Flex gridGap={spacing[1]} backgroundColor={COLORS.blue50}>
            <Box className={styles.styled_box} />
            <Box className={styles.styled_box} />
          </Flex>
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
