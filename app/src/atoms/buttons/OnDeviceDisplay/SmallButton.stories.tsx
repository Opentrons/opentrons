import * as React from 'react'
import { SmallButton } from './SmallButton'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Buttons/SmallButton',
  argTypes: { onClick: { action: 'clicked' } },
  component: SmallButton,
} as Meta

const Template: Story<React.ComponentProps<typeof SmallButton>> = args => (
  <SmallButton {...args} />
)

export const Default = Template.bind({})
Default.args = {
  buttonType: 'default',
  buttonText: 'Button text',
}

export const Alert = Template.bind({})
Alert.args = {
  buttonType: 'alert',
  buttonText: 'Button text',
}

export const Alt = Template.bind({})
Alt.args = {
  buttonType: 'alt',
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

export const StartIconDefault = Template.bind({})
StartIconDefault.args = {
  buttonType: 'default',
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

export const AltRounded = Template.bind({})
AltRounded.args = {
  buttonType: 'alt',
  buttonText: 'Button text',
  buttonCategory: 'rounded',
}
