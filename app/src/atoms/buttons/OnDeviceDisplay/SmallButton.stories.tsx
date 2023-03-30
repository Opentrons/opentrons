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
  buttonType: 'TertiaryLowLight',
  buttonText: 'Button text',
}

export const TertiaryHighLight = Template.bind({})
TertiaryHighLight.args = {
  buttonType: 'tertiaryHighLight',
  buttonText: 'Button text',
}

export const LeftIconDefault = Template.bind({})
LeftIconDefault.args = {
  buttonType: 'default',
  buttonText: 'Button text',
  iconPlacement: 'left',
  iconName: 'reset',
}

export const RightIconAlert = Template.bind({})
RightIconAlert.args = {
  buttonType: 'alert',
  buttonText: 'Button text',
  iconPlacement: 'right',
  iconName: 'play-round-corners',
}

export const AltRounded = Template.bind({})
AltRounded.args = {
  buttonType: 'alt',
  buttonText: 'Button text',
  buttonCategory: 'rounded',
}
