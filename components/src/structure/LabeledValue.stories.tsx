import * as React from 'react'
import { LabeledValue } from './LabeledValue'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/LabeledValue',
} as Meta

const Template: Story<React.ComponentProps<typeof LabeledValue>> = args => (
  <LabeledValue {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  label: 'Here is the label',
  value: "This is the value that needs a label",
}
