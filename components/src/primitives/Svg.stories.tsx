import { createElement } from 'react'

import { Svg as SvgComponent } from './Svg'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SvgComponent> = {
  title: 'Library/Atoms/Svg',
  component: SvgComponent,
}

export default meta

type Story = StoryObj<typeof SvgComponent>

export const Svg: Story = {
  args: {
    svgWidth: '300',
    svgHeight: '300',
    children: [
      createElement('rect', {
        key: 'rect',
        height: '40',
        width: '40',
        x: '50',
        y: '50',
        fill: 'red',
        stroke: 'rebeccapurple',
      }),
      createElement('circle', {
        key: 'circle',
        cx: '140',
        cy: '140',
        r: '40',
        fill: 'green',
        stroke: 'black',
      }),
    ],
  },
}
