import * as React from 'react'
import { InputField } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/InputField',
  component: InputField,
} as Meta

const Template: Story<React.ComponentProps<typeof InputField>> = args => (
  <InputField {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  value: 200,
  units: 'RPM',
  type: 'number',
  caption: 'example caption',
  max: 200,
  min: 200,
}

export const ErrorMessage = Template.bind({})
ErrorMessage.args = {
  units: 'C',
  type: 'number',
  caption: 'example caption',
  max: 10,
  min: 10,
  error: 'input does not equal 10',
}
