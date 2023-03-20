import * as React from 'react'
import { LargeButton } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Buttons/LargeButton',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const LargeButtonTemplate: Story<
  React.ComponentProps<typeof LargeButton>
> = args => <LargeButton {...args} />

export const PrimaryLargeButton = LargeButtonTemplate.bind({})
PrimaryLargeButton.args = {
  buttonText: 'Button text',
  buttonType: 'primary',
  disabled: false,
}
export const SecondaryLargeButton = LargeButtonTemplate.bind({})
SecondaryLargeButton.args = {
  buttonText: 'Button text',
  buttonType: 'secondary',
  disabled: false,
}
export const AlertLargeButton = LargeButtonTemplate.bind({})
AlertLargeButton.args = {
  buttonText: 'Button text',
  buttonType: 'alert',
  disabled: false,
}
