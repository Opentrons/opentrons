import * as React from 'react'
import { Svg as SvgComponent } from './Svg'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Svg',
} as Meta

const Template: Story<React.ComponentProps<typeof SvgComponent>> = args => (
  <SvgComponent {...args} />
)
export const Svg = Template.bind({})
Svg.args = {
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
