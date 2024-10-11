import { BORDERS, COLORS } from '../helix-design-system'
import { SPACING } from '../ui-style-constants'
import { DIRECTION_COLUMN, JUSTIFY_SPACE_AROUND } from '../styles'
import { LegacyStyledText } from '../atoms/StyledText'
import { Box, Flex as FlexComponent } from '../primitives'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof FlexComponent> = {
  title: 'Library/Atoms/Flex',
  component: FlexComponent,
}

export default meta

type Story = StoryObj<typeof FlexComponent>

export const Flex: Story = {
  args: {
    children: [
      <Box
        key="1"
        backgroundColor={COLORS.red60}
        padding={SPACING.spacing16}
        borderRadius={BORDERS.borderRadius4}
      >
        <LegacyStyledText as="p" color={COLORS.white}>
          This is a flex child
        </LegacyStyledText>
      </Box>,
      <Box
        key="2"
        backgroundColor={COLORS.blue60}
        padding={SPACING.spacing16}
        borderRadius={BORDERS.borderRadius4}
      >
        <LegacyStyledText as="p" color={COLORS.white}>
          This is a flex child
        </LegacyStyledText>
      </Box>,
    ],
    flexDirection: DIRECTION_COLUMN,
    justifyContent: JUSTIFY_SPACE_AROUND,
    backgroundColor: 'grey',
    border: '1px solid black',
    padding: '1rem',
    maxWidth: '20rem',
    height: '10rem',
  },
}
