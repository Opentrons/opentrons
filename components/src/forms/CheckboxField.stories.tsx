import * as React from 'react'

import { CheckboxField } from './CheckboxField'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/CheckboxField',
  argTypes: { onChange: { action: 'clicked' } },
} as Meta

const Template: Story<React.ComponentProps<typeof CheckboxField>> = args => {
  const [isChecked, setIsChecked] = React.useState<boolean>(false)
  return (
    <CheckboxField
      {...args}
      onChange={e => {
        setIsChecked(!isChecked)
        args.onChange(e)
      }}
      value={isChecked}
    />
  )
}
export const Basic = Template.bind({})
Basic.args = {
  label: 'Remember this setting?',
}

export const Indeterminate = Template.bind({})
Indeterminate.args = {
  label: 'Shared field check box',
  isIndeterminate: true,
}
