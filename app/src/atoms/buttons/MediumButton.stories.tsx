import * as React from 'react'
import { MediumButton } from './'
import type { Story, Meta } from '@storybook/react'
import { ICON_DATA_BY_NAME } from '@opentrons/components/src/icons/icon-data'

export default {
  title: 'ODD/Atoms/Buttons/MediumButton',
  argTypes: {
    iconName: {
      control: {
        type: 'select',
        options: Object.keys(ICON_DATA_BY_NAME),
      },
      defaultValue: undefined,
    },
    buttonCategory: {
      control: {
        type: 'select',
        options: ['default', 'rounded'],
      },
      defaultValue: undefined,
    },
    onClick: { action: 'clicked' },
    width: {
      control: {
        type: 'text',
      },
      defaultValue: undefined,
    },
  },
} as Meta

const MediumButtonTemplate: Story<
  React.ComponentProps<typeof MediumButton>
> = args => <MediumButton {...args} />

export const PrimaryMediumButton = MediumButtonTemplate.bind({})
PrimaryMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'primary',
  disabled: false,
}
export const SecondaryMediumButton = MediumButtonTemplate.bind({})
SecondaryMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'secondary',
  disabled: false,
}
export const AlertMediumButton = MediumButtonTemplate.bind({})
AlertMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'alert',
  disabled: false,
}
export const AlertSecondaryMediumButton = MediumButtonTemplate.bind({})
AlertSecondaryMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'alertSecondary',
  disabled: false,
}
export const TertiaryHighMediumButton = MediumButtonTemplate.bind({})
TertiaryHighMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'tertiaryHigh',
  disabled: false,
}
export const TertiaryLowLightMediumButton = MediumButtonTemplate.bind({})
TertiaryLowLightMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'tertiaryLowLight',
  disabled: false,
}
