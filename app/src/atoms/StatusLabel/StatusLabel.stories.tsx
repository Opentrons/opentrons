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
<<<<<<< HEAD
  backgroundColor: COLORS.blue30
  iconColor: COLORS.blue50,
=======
  backgroundColor: COLORS.medBlue,
  iconColor: COLORS.blueEnabled,
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
  pulse: true,
}

export const Holding = Template.bind({})
Holding.args = {
  status: 'Holding at target',
<<<<<<< HEAD
  backgroundColor: COLORS.blue30
  iconColor: COLORS.blue50,
=======
  backgroundColor: COLORS.medBlue,
  iconColor: COLORS.blueEnabled,
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
  pulse: false,
}

export const Idle = Template.bind({})
Idle.args = {
  status: 'Idle',
  backgroundColor: COLORS.grey35,
  iconColor: COLORS.grey50Enabled,
  pulse: true,
}

export const Error = Template.bind({})
Error.args = {
  status: 'Error',
  backgroundColor: COLORS.yellow20,
  iconColor: COLORS.yellow50,
  pulse: true,
}
