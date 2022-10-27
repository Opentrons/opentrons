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

export const Primary = Template.bind({})
Primary.args = {
  onClick: () => {},
  label: 'extension mount',
  description: 'Opentrons Gripper GEN1',
  isGripper: true,
  menuOverlayItems: [
    {
      children: 'menu option',
      onClick: () => console.log('item click'),
    },
  ],
}
