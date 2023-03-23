import * as React from 'react'
import { MediumButton } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Buttons/MediumButton',
  argTypes: { onClick: { action: 'clicked' } },
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
export const TertiaryMediumButton = MediumButtonTemplate.bind({})
TertiaryMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'tertiaryHigh',
  disabled: false,
}
export const TertiaryLightMediumButton = MediumButtonTemplate.bind({})
TertiaryLightMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'tertiaryHighLight',
  disabled: false,
}
export const CustomIconMediumButton = MediumButtonTemplate.bind({})
CustomIconMediumButton.args = {
  buttonText: 'Button text',
  buttonType: 'primary',
  iconName: 'restart',
}
export const CustomWideIconMediumButton = MediumButtonTemplate.bind({})
CustomWideIconMediumButton.args = {
  buttonText: 'Pin protocol',
  buttonType: 'secondary',
  iconName: 'push-pin',
  width: '30.375rem',
}
