import * as React from 'react'

import { BlueCheckboxField as CheckboxFieldComponent } from './BlueCheckboxField'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Blue Checkbox Field',
  component: CheckboxFieldComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof CheckboxFieldComponent>
> = args => {
  const [isChecked, setIsChecked] = React.useState<boolean>(false)
  return (
    <CheckboxFieldComponent
      {...args}
      onChange={e => {
        setIsChecked(!isChecked)
        args.onChange(e)
      }}
      value={isChecked}
    />
  )
}
export const BlueCheckboxField = Template.bind({})
BlueCheckboxField.args = {
  label: 'Remember this setting?',
  isIndeterminate: false,
}
