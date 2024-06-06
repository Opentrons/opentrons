import { ICON_DATA_BY_NAME, VIEWPORT } from '@opentrons/components'
import { MediumButton } from './'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof MediumButton> = {
  title: 'ODD/Atoms/Buttons/MediumButton',
  component: MediumButton,
  argTypes: {
    iconName: {
      control: {
        type: 'select',
      },
      options: Object.keys(ICON_DATA_BY_NAME),
    },
    buttonCategory: {
      control: {
        type: 'select',
      },
      options: ['default', 'rounded'],
    },
    onClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta
type Story = StoryObj<typeof MediumButton>

export const PrimaryMediumButton: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'primary',
    disabled: false,
  },
}

export const SecondaryMediumButton: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'secondary',
    disabled: false,
  },
}

export const AlertMediumButton: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'alert',
    disabled: false,
  },
}
export const AlertSecondaryMediumButton: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'alertSecondary',
    disabled: false,
  },
}

export const TertiaryHighMediumButton: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'tertiaryHigh',
    disabled: false,
  },
}

export const TertiaryLowLightMediumButton: Story = {
  args: {
    buttonText: 'Button text',
    buttonType: 'tertiaryLowLight',
    disabled: false,
  },
}
