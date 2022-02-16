import * as React from 'react'
import { TitleBar } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/TitleBar',
  component: TitleBar,
} as Meta

const Template: Story<React.ComponentProps<typeof TitleBar>> = args => (
  <TitleBar {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  title: 'Title goes here',
  exit: { title: 'Exit', children: 'Exit' },
}
