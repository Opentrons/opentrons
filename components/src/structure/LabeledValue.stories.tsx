import { LabeledValue as LabeledValueComponent } from './LabeledValue'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

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
