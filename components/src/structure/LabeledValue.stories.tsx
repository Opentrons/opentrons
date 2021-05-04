import * as React from 'react'
import { LabeledValue as LabeledValueComponent } from './LabeledValue'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Labeled Value',
} as Meta

const Template: Story<
  React.ComponentProps<typeof LabeledValueComponent>
> = args => <LabeledValueComponent {...args} />
export const LabeledValue = Template.bind({})
LabeledValue.args = {
  label: 'Here is the label',
  value: 'This is the value that needs a label',
}
