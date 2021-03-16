import * as React from 'react'
import { Svg } from './Svg'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Svg',
} as Meta

const Template: Story<React.ComponentProps<typeof Svg>> = args => (
  <Svg {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  svgWidth: '300',
  svgHeight: '300',
  children: [
    <rect
      key="rect"
      height="40"
      width="40"
      x="50"
      y="50"
      fill="red"
      stroke="rebeccapurple"
    />,
    <circle
      key="circle"
      cx="140"
      cy="140"
      r="40"
      fill="green"
      stroke="black"
    />,
  ],
}
