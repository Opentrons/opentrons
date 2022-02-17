import * as React from 'react'
import { Interstitial } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Interstitial',
  component: Interstitial,
} as Meta

const Template: Story<React.ComponentProps<typeof Interstitial>> = args => (
  <Interstitial {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  titleBar: {
    title: 'title',
    exit: {
      onClick: () => jest.fn(),
      title: 'exit',
      children: 'exit',
    },
  },
}
