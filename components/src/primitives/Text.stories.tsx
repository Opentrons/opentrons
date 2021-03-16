import * as React from 'react'
import { Text } from './Text'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Text',
} as Meta

const Template: Story<React.ComponentProps<typeof Text>> = args => (
  <Text {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  children: 'This is a bunch text of text',
  color: 'grey',
}
