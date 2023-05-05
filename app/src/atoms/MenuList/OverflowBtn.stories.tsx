import * as React from 'react'
import type { Story, Meta } from '@storybook/react'

import { OverflowBtn } from './OverflowBtn'

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
