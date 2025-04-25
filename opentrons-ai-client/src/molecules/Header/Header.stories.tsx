import { COLORS, Flex, SPACING } from '@opentrons/components'

import { Header as HeaderComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof HeaderComponent> = {
  title: 'AI/Molecules/Header',
  component: HeaderComponent,
  decorators: [
    Story => (
      <Flex backgroundColor={COLORS.grey10} padding={SPACING.spacing40}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof HeaderComponent>

export const ChatHeaderExample: Story = {}
