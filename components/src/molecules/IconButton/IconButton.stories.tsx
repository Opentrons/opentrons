import { COLORS } from '../../helix-design-system'
import { ICON_DATA_BY_NAME } from '../../icons'
import { Flex } from '../../primitives'
import { SPACING } from '../../ui-style-constants'
import { IconButton as IconButtonComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof IconButtonComponent> = {
  title: 'Helix/Molecules/IconButton',
  component: IconButtonComponent,
  argTypes: {
    iconName: {
      control: {
        type: 'select',
      },
      options: Object.keys(ICON_DATA_BY_NAME),
    },
  },
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof IconButtonComponent>

export const PlayIconButton: Story = {
  args: {
    iconName: 'play',
    iconSize: '1.5rem',
    iconColor: COLORS.white,
    variant: 'primary',
    size: '3rem',
    onClick: () => {
      console.log('clicked play')
    },
  },
}

export const PauseIconButton: Story = {
  args: {
    iconName: 'pause',
    iconSize: '1.5rem',
    iconColor: COLORS.white,
    variant: 'primary',
    size: '3rem',
    onClick: () => {
      console.log('clicked pause')
    },
  },
}

export const StopIconButton: Story = {
  args: {
    iconName: 'close-icon',
    iconSize: '1.5rem',
    iconColor: COLORS.white,
    variant: 'alert',
    size: '3rem',
    onClick: () => {
      console.log('clicked stop')
    },
  },
}
