import { COLORS, Flex, SPACING } from '@opentrons/components'

import { HeaderWithMeter as HeaderWithMeterComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof HeaderWithMeterComponent> = {
  title: 'AI/Molecules/HeaderWithMeter',
  component: HeaderWithMeterComponent,
  decorators: [
    Story => (
      <Flex backgroundColor={COLORS.grey10} padding={SPACING.spacing40}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof HeaderWithMeterComponent>

export const HeaderWithMeterExample: Story = {}
