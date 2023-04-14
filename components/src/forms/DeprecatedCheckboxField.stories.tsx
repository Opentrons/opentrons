import * as React from 'react'

import { DeprecatedCheckboxField as DeprecatedCheckboxComponent } from './DeprecatedCheckboxField'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Deprecated Checkbox Field',
  component: DeprecatedCheckboxComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof DeprecatedCheckboxComponent>
> = args => {
  const [isChecked, setIsChecked] = React.useState<boolean>(false)
  return (
    <DeprecatedCheckboxComponent
      {...args}
      onChange={e => {
        setIsChecked(!isChecked)
        args.onChange(e)
      }}
      value={isChecked}
    />
  )
}
export const DeprecatedCheckboxField = Template.bind({})
DeprecatedCheckboxField.args = {
  label: 'Remember this setting?',
  isIndeterminate: false,
}
