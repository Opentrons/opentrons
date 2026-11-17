import { action } from 'storybook/actions'
import { useArgs } from 'storybook/preview-api'

import { Checkbox } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Checkbox> = {
  title: 'Helix/Atoms/Checkbox',
  component: Checkbox,
  args: {
    onChange: action('onChange'),
  },
}

type Story = StoryObj<typeof Checkbox>

export const Basic: Story = {
  name: 'Checkbox',
  args: {
    isChecked: true,
    labelText: 'Checkbox Label',
    tabIndex: 1,
    disabled: false,
  },
  render: function Render(args) {
    const [{ isChecked }, updateArgs] = useArgs()
    const checked = Boolean(isChecked)

    return (
      <Checkbox
        {...args}
        isChecked={checked}
        onChange={e => {
          args.onChange(e)
          updateArgs({ isChecked: !checked })
        }}
      />
    )
  },
}

export const Disabled: Story = {
  args: {
    isChecked: false,
    labelText: 'Disabled Checkbox',
    disabled: true,
  },
}

export default meta
