import * as React from 'react'
import { LEGACY_COLORS } from '@opentrons/components'
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
  backgroundColor: COLORS.blue30
  iconColor: COLORS.blue50,
  pulse: true,
}

export const Holding = Template.bind({})
Holding.args = {
  status: 'Holding at target',
  backgroundColor: COLORS.blue30
  iconColor: COLORS.blue50,
  pulse: false,
}

export const Idle = Template.bind({})
Idle.args = {
  status: 'Idle',
  backgroundColor: LEGACY_COLORS.medGreyEnabled,
  iconColor: LEGACY_COLORS.darkGreyEnabled,
  pulse: true,
}

export const Error = Template.bind({})
Error.args = {
  status: 'Error',
  backgroundColor: LEGACY_COLORS.warningBackgroundLight,
  iconColor: LEGACY_COLORS.warningEnabled,
  pulse: true,
}
