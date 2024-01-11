import * as React from 'react'
import { COLORS } from '@opentrons/components'
import { StatusLabel } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/StatusLabel',
  component: StatusLabel,
} as Meta

const Template: Story<React.ComponentProps<typeof StatusLabel>> = args => (
  <StatusLabel {...args} />
)

export const Active = Template.bind({})
Active.args = {
  status: 'Heating',
  backgroundColor: COLORS.medBlue,
  iconColor: COLORS.blueEnabled,
  pulse: true,
}

export const Holding = Template.bind({})
Holding.args = {
  status: 'Holding at target',
  backgroundColor: COLORS.medBlue,
  iconColor: COLORS.blueEnabled,
  pulse: false,
}

export const Idle = Template.bind({})
Idle.args = {
  status: 'Idle',
  backgroundColor: COLORS.grey35,
  iconColor: COLORS.grey50,
  pulse: true,
}

export const Error = Template.bind({})
Error.args = {
  status: 'Error',
  backgroundColor: COLORS.yellow20,
  iconColor: COLORS.yellow50,
  pulse: true,
}
