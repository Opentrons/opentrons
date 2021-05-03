import * as React from 'react'
import { Text as TextComponent } from './Text'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Text',
} as Meta

const Template: Story<React.ComponentProps<typeof TextComponent>> = args => (
  <TextComponent {...args} />
)
export const Text = Template.bind({})
Text.args = {
  children: 'This is a bunch text of text',
  color: 'grey',
}
