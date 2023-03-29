import * as React from 'react'

import { FormGroup as FormGroupComponent } from './FormGroup'
import { DeprecatedCheckboxField } from './DeprecatedCheckboxField.stories'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Form Group',
  argTypes: { onChange: { action: 'clicked' } },
} as Meta

const Template: Story<
  React.ComponentProps<typeof FormGroupComponent>
> = args => <FormGroupComponent {...args} />
export const FormGroup = Template.bind({})
FormGroup.args = {
  label: 'This is a FormGroup',
  children: [
    <DeprecatedCheckboxField
      onChange={e => {}}
      key="first"
      label="first field"
    />,
    <DeprecatedCheckboxField
      onChange={e => {}}
      key="second"
      label="second field"
    />,
  ],
}
