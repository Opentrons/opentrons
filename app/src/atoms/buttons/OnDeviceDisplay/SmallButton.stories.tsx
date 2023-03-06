import * as React from 'react'
import { COLORS } from '@opentrons/components'
import { SmallButton } from './SmallButton'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/SmallButton',
  component: SmallButton,
} as Meta

const Template: Story<React.ComponentProps<typeof SmallButton>> = args => (
  <SmallButton {...args} />
)

export const Default = Template.bind({})
Default.args = {
  onClick: () => console.log('click'),
  buttonType: 'default',
  buttonText: 'text',
}

export const Alert = Template.bind({})
Alert.args = {
  onClick: () => console.log('click'),
  buttonType: 'alert',
  buttonText: 'text',
}

export const Alt = Template.bind({})
Alt.args = {
  onClick: () => console.log('click'),
  buttonType: 'alt',
  buttonText: 'text',
}

export const GhostLow = Template.bind({})
GhostLow.args = {
  onClick: () => console.log('click'),
  buttonType: 'ghostLow',
  buttonText: 'text',
}

export const GhostHighBlack = Template.bind({})
GhostHighBlack.args = {
  onClick: () => console.log('click'),
  buttonType: 'ghostHigh',
  buttonText: 'text',
  textColor: COLORS.darkBlackEnabled,
}

export const GhostHighBlue = Template.bind({})
GhostHighBlue.args = {
  onClick: () => console.log('click'),
  buttonType: 'ghostHigh',
  buttonText: 'text',
  textColor: COLORS.blueEnabled,
}
