import * as React from 'react'
import type { Story, Meta } from '@storybook/react'

import { MenuItem } from './MenuItem'

export default {
  title: 'App/Atoms/MenuItem',
  component: MenuItem,
} as Meta

const Template: Story<React.ComponentProps<typeof MenuItem>> = args => (
  <MenuItem {...args} />
)
export const Primary = Template.bind({})
Primary.args = {
  children: 'Example menu btn',
  disabled: false,
}

Primary.parameters = {
  viewport: {
    defaultViewport: 'onDeviceDisplay',
  },
}
