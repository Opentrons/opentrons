import { ICON_DATA_BY_NAME, VIEWPORT } from '@opentrons/components'
import { LargeButton } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof LargeButton> = {
  title: 'ODD/Atoms/Buttons/LargeButton',
  component: LargeButton,
  argTypes: {
    onClick: { action: 'clicked' },
    iconName: {
      control: {
        type: 'select',
      },
      options: Object.keys(ICON_DATA_BY_NAME),
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof LargeButton>

export const Primary: Story = {
  args: {
    buttonText: 'Button text',
    disabled: false,
    iconName: 'play-round-corners',
  },
}
export const Secondary: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'secondary',
    disabled: false,
    iconName: 'build',
  },
}
export const Alert: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'alert',
    disabled: false,
    iconName: 'reset',
  },
}
