import * as React from 'react'

import { FormGroup as FormGroupComponent } from './FormGroup'
import { CheckboxField } from './CheckboxField.stories'

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
    <CheckboxField onChange={e => {}} key="first" label="first field" />,
    <CheckboxField onChange={e => {}} key="second" label="second field" />,
  ],
}
