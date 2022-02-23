import * as React from 'react'
import { InterstitialTitleBar } from './InterstitiallTitleBar'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/InterstitialTitleBar',
  component: InterstitialTitleBar,
} as Meta

const Template: Story<
  React.ComponentProps<typeof InterstitialTitleBar>
> = args => <InterstitialTitleBar {...args} />

export const Primary = Template.bind({})
Primary.args = {
  title: 'Title goes here',
  exit: { title: 'Exit', children: 'Exit' },
}
