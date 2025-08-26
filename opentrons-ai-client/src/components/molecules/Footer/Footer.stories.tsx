import { COLORS, Flex } from '@opentrons/components'

import { Footer } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Footer> = {
  title: 'AI/Molecules/Footer',
  component: Footer,
  decorators: [
    Story => (
      <Flex backgroundColor={COLORS.grey10}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Footer>

export const FooterExample: Story = {}
