import * as React from 'react'
import { OverflowMenuBtn } from './OverflowMenuBtn'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/OverflowMenuBtn',
  component: OverflowMenuBtn,
} as Meta

const Template: Story<React.ComponentProps<typeof OverflowMenuBtn>> = args => (
  <OverflowMenuBtn {...args} />
)
export const Primary = Template.bind({})
Primary.args = {
  children: 'Example menu btn',
}
