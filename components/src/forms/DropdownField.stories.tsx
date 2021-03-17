import * as React from 'react'

import { DropdownField } from './DropdownField'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/DropdownField',
  argTypes: { onChange: { action: 'clicked' } },
} as Meta

const Template: Story<React.ComponentProps<typeof DropdownField>> = args => {
  const [selectedValue, setSelectedValue] = React.useState<string | null>(null)
  return (
    <DropdownField
      {...args}
      onChange={e => {
        setSelectedValue(e.target.value)
        args.onChange(e)
      }}
      value={selectedValue}
    />
  )
}
export const Basic = Template.bind({})
Basic.parameters = {
  docs: {
    description: {
      component:
        '`DropdownField` is similar to `SelectField`, but more normal. It uses a `<select>` component and has an onChange/onBlur/etc that use DOM events. When `value` prop is truthy, the "blank" option isn\'t shown.  When `value` is falsey, the "blank" option appears and is selected. You can\'t get back to blank state once you\'re selected something without external state manipulation. This is similar to how `RadioGroup` works.',
    },
  },
}
Basic.args = {
  options: [
    { name: 'DNA', value: 'dna' },
    { name: 'RNA', value: 'rna' },
    { name: 'Protein', value: 'protein' },
  ],
}

export const BlankOption = Template.bind({})
BlankOption.parameters = {
  docs: {
    description: {
      story:
        'To make a `DropdownField` always allow the user to select a blank value, add an option object to the `options` prop with a blank (empty string) value:',
    },
  },
}
BlankOption.args = {
  options: [
    { name: '', value: '' },
    { name: 'DNA', value: 'dna' },
    { name: 'RNA', value: 'rna' },
    { name: 'Protein', value: 'protein' },
  ],
}

export const Indeterminate = Template.bind({})
Indeterminate.parameters = {
  docs: {
    description: {
      story:
        "When `isIndeterminate` prop is present and true, prepopulate the dropdown with the '-' placeholder, disabled value. This value can not be selected or returned to once changed.",
    },
  },
}
Indeterminate.args = {
  options: [
    { name: 'DNA', value: 'dna' },
    { name: 'RNA', value: 'rna' },
    { name: 'Protein', value: 'protein' },
  ],
  isIndeterminate: true,
}
