import * as React from 'react'

import { Flex } from '../../primitives'
import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { Tag as TagComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof TagComponent> = {
  title: 'Library/Atoms/Chip',
  argTypes: {
    type: {
      options: ['default', 'interactive', 'branded'],
      control: {
        type: 'select',
      },
    },
    iconName: {
      options: ['info', 'ot-alert'],
      control: {
        type: 'select',
      },
    },
    iconPosition: {
      options: ['left', 'right'],
      control: {
        type: 'select',
      },
    },
  },
  component: TagComponent,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16} width="59rem">
        <Story />
      </Flex>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TagComponent>

export const Tag: Story = {
  args: {
    type: 'default',
    text: 'Text',
    iconPosition: 'left',
  },
}
