import { action } from 'storybook/actions'
import { useArgs } from 'storybook/preview-api'

import { CheckboxBasic } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof CheckboxBasic> = {
  title: 'Helix/Atoms/CheckboxBasic',
  component: CheckboxBasic,
  args: {
    onChange: action('onChange'),
  },
  argTypes: {
    checked: {
      control: 'inline-radio',
      options: [false, true, 'indeterminate'],
      mapping: { false: false, true: true, indeterminate: 'indeterminate' },
    },
  },
}

export default meta

type Story = StoryObj<typeof CheckboxBasic>

export const Playground: Story = {
  args: {
    checked: false,
    disabled: false,
    onColor: false,
  },
  render: function Render(args) {
    const [{ checked }, updateArgs] = useArgs<{
      checked: boolean | 'indeterminate'
    }>()
    return (
      <CheckboxBasic
        {...args}
        checked={checked}
        onChange={e => {
          args.onChange(e)
          updateArgs({ checked: !checked })
        }}
      />
    )
  },
}
