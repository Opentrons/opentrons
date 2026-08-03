import { action } from 'storybook/actions'

import { ICON_DATA_BY_NAME } from '../../icons'
import { SPACING } from '../../ui-style-constants'
// Note: this will be renamed to IconButton when remove IconButton from components
import { NewIconButton as IconButtonComponent } from './index'

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
    size: {
      control: {
        type: 'select',
      },
      options: ['sm', 'md'],
    },
  },
  decorators: [
    Story => (
      <div style={{ padding: SPACING.spacing16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof IconButtonComponent>

export const PlayIconButton: Story = {
  args: {
    iconName: 'play',
    variant: 'primary',

    onClick: () => {
      action('clicked play')()
    },

    iconSize: '',
    size: 'sm',
  },
}

export const PauseIconButton: Story = {
  args: {
    iconName: 'pause',
    variant: 'primary',
    onClick: () => {
      action('clicked pause')()
    },
  },
}

export const StopIconButton: Story = {
  args: {
    iconName: 'close-icon',
    variant: 'alert',
    onClick: () => {
      action('clicked stop')()
    },
  },
}
