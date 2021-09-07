import * as React from 'react'

import { DropdownField as DropdownFieldComponent } from './DropdownField'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Dropdown Field',
  argTypes: { onChange: { action: 'clicked' } },
} as Meta

const Template: Story<
  React.ComponentProps<typeof DropdownFieldComponent>
> = args => {
  const [selectedValue, setSelectedValue] = React.useState<string | null>(null)
  return (
    <DropdownFieldComponent
      {...args}
      onChange={e => {
        setSelectedValue(e.target.value)
        args.onChange(e)
      }}
      value={selectedValue}
    />
  )
}
export const DropdownField = Template.bind({})
DropdownField.parameters = {
  docs: {
    description: {
      component:
        '`DropdownField` is similar to `SelectField`, but more normal. It uses a `<select>` component and has an onChange/onBlur/etc that use DOM events. When `value` prop is truthy, the "blank" option isn\'t shown.  When `value` is falsey, the "blank" option appears and is selected. You can\'t get back to blank state once you\'re selected something without external state manipulation. This is similar to how `RadioGroup` works. In order to always allow the user to select a blank value, add an option object to the `options` prop with a blank (empty string) value.',
    },
  },
}
DropdownField.args = {
  options: [
    { name: '', value: '' },
    { name: 'DNA', value: 'dna' },
    { name: 'RNA', value: 'rna' },
    { name: 'Protein', value: 'protein' },
  ],
  isIndeterminate: false,
}
