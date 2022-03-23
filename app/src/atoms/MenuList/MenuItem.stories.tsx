import * as React from 'react'
import { MenuItem } from './MenuItem'

import type { Story, Meta } from '@storybook/react'

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
}
