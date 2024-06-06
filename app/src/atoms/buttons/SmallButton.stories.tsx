import { VIEWPORT } from '@opentrons/components'
import { SmallButton } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SmallButton> = {
  title: 'ODD/Atoms/Buttons/SmallButton',
  argTypes: { onClick: { action: 'clicked' } },
  component: SmallButton,
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof SmallButton>

export const Primary: Story = {
  args: {
    buttonText: 'Button text',
  },
}

export const Alert: Story = {
  args: {
    buttonType: 'alert',
    buttonText: 'Button text',
  },
}

export const Secondary: Story = {
  args: {
    buttonType: 'secondary',
    buttonText: 'Button text',
  },
}

export const TertiaryLowLight: Story = {
  args: {
    buttonType: 'tertiaryLowLight',
    buttonText: 'Button text',
  },
}

export const TertiaryHighLight: Story = {
  args: {
    buttonType: 'tertiaryHighLight',
    buttonText: 'Button text',
  },
}

export const StartIconPrimary: Story = {
  args: {
    buttonType: 'primary',
    buttonText: 'Button text',
    iconPlacement: 'startIcon',
    iconName: 'reset',
  },
}

export const EndIconAlert: Story = {
  args: {
    buttonType: 'alert',
    buttonText: 'Button text',
    iconPlacement: 'endIcon',
    iconName: 'play-round-corners',
  },
}

export const SecondaryRounded: Story = {
  args: {
    buttonType: 'secondary',
    buttonText: 'Button text',
    buttonCategory: 'rounded',
  },
}
