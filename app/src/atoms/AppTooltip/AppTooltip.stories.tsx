import * as React from 'react'
import { AppTooltip } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/AppTooltip',
  component: AppTooltip,
} as Meta

const Template: Story<React.ComponentProps<typeof AppTooltip>> = args => (
  <AppTooltip {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  key: 'key',
  children: 'tooltip text',
}
