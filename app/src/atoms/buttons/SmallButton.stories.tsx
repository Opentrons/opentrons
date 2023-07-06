import * as React from 'react'
import { SmallButton } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Buttons/SmallButton',
  argTypes: { onClick: { action: 'clicked' } },
  component: SmallButton,
} as Meta

const Template: Story<React.ComponentProps<typeof SmallButton>> = args => (
  <SmallButton {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  buttonText: 'Button text',
}

export const Alert = Template.bind({})
Alert.args = {
  buttonType: 'alert',
  buttonText: 'Button text',
}

export const Secondary = Template.bind({})
Secondary.args = {
  buttonType: 'secondary',
  buttonText: 'Button text',
}

export const TertiaryLowLight = Template.bind({})
TertiaryLowLight.args = {
  buttonType: 'tertiaryLowLight',
  buttonText: 'Button text',
}

export const TertiaryHighLight = Template.bind({})
TertiaryHighLight.args = {
  buttonType: 'tertiaryHighLight',
  buttonText: 'Button text',
}

export const StartIconPrimary = Template.bind({})
StartIconPrimary.args = {
  buttonType: 'primary',
  buttonText: 'Button text',
  iconPlacement: 'startIcon',
  iconName: 'reset',
}

export const EndIconAlert = Template.bind({})
EndIconAlert.args = {
  buttonType: 'alert',
  buttonText: 'Button text',
  iconPlacement: 'endIcon',
  iconName: 'play-round-corners',
}

export const SecondaryRounded = Template.bind({})
SecondaryRounded.args = {
  buttonType: 'secondary',
  buttonText: 'Button text',
  buttonCategory: 'rounded',
}
