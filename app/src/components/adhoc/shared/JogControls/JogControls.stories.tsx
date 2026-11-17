import { JogControls } from './index'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'App/Molecules/JogControls',
  component: JogControls,
} as Meta

const Template: Story<React.ComponentProps<typeof JogControls>> = args => (
  <JogControls {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  jog: () => {},
  planes: ['horizontal', 'vertical'],
}
