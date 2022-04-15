import * as React from 'react'
import { Tooltip } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Tooltip',
  component: Tooltip,
} as Meta

const Template: Story<React.ComponentProps<typeof Tooltip>> = args => (
  <Tooltip {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  key: 'key',
  children: 'tooltip text',
}
