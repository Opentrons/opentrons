import * as React from 'react'
import { InstrumentCard } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/InstrumentCard',
  component: InstrumentCard,
} as Meta

const Template: Story<React.ComponentProps<typeof InstrumentCard>> = args => (
  <InstrumentCard {...args} />
)

export const Attached = Template.bind({})
Attached.args = {
  onClick: () => {},
  label: 'extension mount',
  description: 'Opentrons Gripper GEN1',
  isGripperAttached: true,
  menuOverlayItems: [
    {
      label: 'menu option 1',
      onClick: () => console.log('item click 1'),
    },
    {
      label: 'menu option 2',
      onClick: () => console.log('item click 2'),
    },
  ],
  isEstopNotDisengaged: false,
}

export const Divider = Template.bind({})
Divider.args = {
  onClick: () => {},
  label: 'extension mount',
  description: 'Opentrons Gripper GEN1',
  hasDivider: true,
  isGripperAttached: true,
  menuOverlayItems: [
    {
      label: 'menu option 1',
      onClick: () => console.log('item click 1'),
    },
    {
      label: 'menu option 2',
      onClick: () => console.log('item click 2'),
    },
  ],
  isEstopNotDisengaged: false,
}

export const Empty = Template.bind({})
Empty.args = {
  onClick: () => {},
  label: 'extension mount',
  description: 'Empty',
  isGripperAttached: false,
  menuOverlayItems: [
    {
      label: 'menu option 1',
      disabled: true,
      onClick: () => console.log('item click 1'),
    },
    {
      label: 'menu option 2',
      disabled: true,
      onClick: () => console.log('item click 2'),
    },
  ],
  isEstopNotDisengaged: false,
}
