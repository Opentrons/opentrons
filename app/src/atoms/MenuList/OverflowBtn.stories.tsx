import { OverflowBtn } from './OverflowBtn'
import type { Story, Meta } from '@storybook/react'
import * as React from 'react'

export default {
  title: 'App/Atoms/OverflowBtn',
  component: OverflowBtn,
} as Meta

const Template: Story<React.ComponentProps<typeof OverflowBtn>> = args => (
  <OverflowBtn {...args} />
)
export const Basic = Template.bind({})
Basic.args = {
  title: 'overflow btn with all the states',
}
