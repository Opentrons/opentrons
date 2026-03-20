import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Slideout } from '../../atoms/Slideout'
import { MiniCard as MiniCardComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

const ROBOT_IMG = '/images/FLEX.png'

const meta: Meta<typeof MiniCardComponent> = {
  title: 'App/Molecules/MiniCard',
  component: MiniCardComponent,
  decorators: [
    (Story, { args }) => (
      <Slideout title="MiniCard" onCloseClick={() => {}} isExpanded={true}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <MiniCardComponent {...args} />
          <MiniCardComponent {...args} isSelected={false} />
          <MiniCardComponent {...args} isSelected={false} />
        </Flex>
      </Slideout>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof MiniCardComponent>

const Children = (
  <Flex alignItems={ALIGN_CENTER} gap={SPACING.spacing8}>
    <Box backgroundColor={COLORS.white}>
      <img src={ROBOT_IMG} style={{ width: '3rem' }} alt="Robot image" />
    </Box>
    <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
      MiniCard stories protocol
    </LegacyStyledText>
  </Flex>
)

export const MiniCard: Story = {
  args: {
    onClick: () => {},
    isSelected: true,
    children: Children,
    isError: false,
  },
}
