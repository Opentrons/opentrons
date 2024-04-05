import * as React from 'react'

import { Flex } from '../../primitives'
import { COLORS } from '../../helix-design-system'
import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { Chip } from '.'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Chip> = {
  title: 'Library/Atoms/Chip',
  argTypes: {
    type: {
      options: ['basic', 'error', 'info', 'neutral', 'success', 'warning'],
      control: {
        type: 'select',
      },
    },
    hasIcon: {
      control: {
        type: 'boolean',
      },
    },
    chipSize: {
      options: ['medium', 'small'],
      control: {
        type: 'select',
      },
    },
    iconName: {
      options: ['connection-status', 'ot-check', 'ot-alert'],
      control: {
        type: 'select',
      },
    },
  },
  component: Chip,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Flex
        padding={SPACING.spacing16}
        backgroundColor={COLORS.grey50}
        width="59rem"
      >
        <Story />
      </Flex>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Chip>

export const ChipComponent: Story = {
  args: {
    type: 'success',
    text: 'Chip component',
    hasIcon: true,
    chipSize: 'medium',
  },
}
