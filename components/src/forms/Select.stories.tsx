import * as React from 'react'

import { Select } from './Select'
import styles from './Select.module.css'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Forms/Select',
  component: Select,
} as Meta

const Template: Story<React.ComponentProps<typeof Select>> = args => (
  <Select {...args} />
)
export const Basic = Template.bind({})
Basic.parameters = {
  docs: {
    description: {
      component:
        'Thin wrapper around `react-select` to apply our Opentrons-specific styles. All props are passed directly to [`react-select`](https://react-select.com/props) except for `styles`, `components`, and `classNamePrefix`. The `className` prop appends to the `className` we pass `react-select`. Those props are not passed directly because they provide the base styling of the component',
    },
  },
}
Basic.args = {
  options: [
    { label: 'DNA', value: 'dna' },
    { label: 'RNA', value: 'rna' },
    { label: 'Protein', value: 'protein', isDisabled: true },
  ],
}

export const GroupedOptions = Template.bind({})
GroupedOptions.parameters = {
  docs: {
    description: {
      component: 'You can also pass grouped options:',
    },
  },
}
GroupedOptions.args = {
  options: [
    {
      label: 'Nucleic Acids',
      options: [
        { label: 'DNA', value: 'dna' },
        { label: 'RNA', value: 'rna' },
      ],
    },
    {
      label: 'Polypeptides',
      options: [
        { label: 'Dipeptide', value: 'dipeptide' },
        { label: 'Tripeptide', value: 'Tripeptide' },
      ],
    },
  ],
}

export const Controlled = Template.bind({})
Controlled.parameters = {
  docs: {
    description: {
      component:
        'Passing `value` controls the input. **Note that `value` has the same format as an entry in `options`**',
    },
  },
}
Controlled.args = {
  value: { label: 'DNA', value: 'dna' },
  options: [
    { label: 'DNA', value: 'dna' },
    { label: 'RNA', value: 'rna' },
    { label: 'Protein', value: 'protein' },
  ],
}

export const FormattedOptionLabel = Template.bind({})
FormattedOptionLabel.parameters = {
  docs: {
    description: {
      component:
        'You can control the renders of individual options with the `formatOptionLabel` prop:',
    },
  },
}
FormattedOptionLabel.args = {
  options: [
    { label: 'DNA', value: 'dna' },
    { label: 'RNA', value: 'rna' },
    { label: 'Protein', value: 'protein' },
  ],
  formatOptionLabel: (option, { context }) =>
    context === 'menu' && option.value === 'rna' ? (
      <span style={{ color: 'green' }}>{option.label}</span>
    ) : (
      option.label
    ),
}

export const StyleOverride = Template.bind({})
StyleOverride.parameters = {
  docs: {
    description: {
      component:
        "To override any styling, we use [`react-select`'s BEM](https://react-select.com/styles#using-classnames) class names with our specific prefix, which is `ot_select`. See `SelectField` for a specific example, where the background color of the `Control` element is modified if the field has an error",
    },
  },
}
StyleOverride.args = {
  className: styles.example_select_override,
  options: [
    { label: 'DNA', value: 'dna' },
    { label: 'RNA', value: 'rna' },
    { label: 'Protein', value: 'protein' },
  ],
}
