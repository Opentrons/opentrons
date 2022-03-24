import * as React from 'react'
import { Banner } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Banner',
  component: Banner,
} as Meta

const Template: Story<React.ComponentProps<typeof Banner>> = args => (
  <Banner {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  title: 'title',
  type: 'success',
}
export const OverriddenIcon = Template.bind({})
OverriddenIcon.args = {
  type: 'warning',
  title: 'Alert with overridden icon',
  icon: { name: 'ot-hot-to-touch' },
}
