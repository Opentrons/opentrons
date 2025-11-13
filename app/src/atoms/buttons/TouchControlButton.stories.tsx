import { VIEWPORT } from '@opentrons/components'

import { TouchControlButton } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof TouchControlButton> = {
  title: 'ODD/Atoms/Buttons/TouchControlButton',
  component: TouchControlButton,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {
    isActive: {
      control: {
        type: 'switch',
      },
    },
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof TouchControlButton>

export const TouchControlButtonComponent: Story = {
  args: {
    title: 'Button title',
    subText: 'Button subtext',
    isActive: false,
    onClick: () => {},
  },
}
