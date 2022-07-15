import * as React from 'react'

import { Select } from './Select'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Select',
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
        'Thin wrapper around `react-select` to apply our Opentrons-specific styles in the app.',
    },
  },
}
Basic.args = {
  options: [
    { label: 'DNA', value: 'dna' },
    { label: 'RNA', value: 'rna' },
    { label: 'Protein', value: 'protein', isDisabled: true },
  ],
  width: '10rem',
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
  width: '10rem',
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
  width: '10rem',
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
  width: '10rem',
  formatOptionLabel: (option, { context }) =>
    context === 'menu' && option.value === 'rna' ? (
      <span style={{ color: 'green' }}>{option.label}</span>
    ) : (
      option.label
    ),
}
