import { useState } from 'react'

import { InputSetting as InputSettingComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InputSettingComponent> = {
  title: 'App/Molecules/InputSetting',
  component: InputSettingComponent,
  argTypes: {
    label: {
      control: 'text',
      description: 'Setting label shown to the left of the input.',
    },
    units: {
      control: 'text',
      description: 'Optional grey suffix shown to the right of the input.',
    },
    placeholder: {
      control: 'text',
      description: 'Optional input placeholder.',
    },
    value: { control: false },
    onChange: { control: false },
  },
  decorators: [
    Story => (
      <div style={{ maxWidth: '42.375rem', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof InputSettingComponent>

export const InputSetting: Story = {
  args: {
    label: 'Maximum login attempts before account deactivation',
    units: 'logins',
  },
  render: args => {
    const [value, setValue] = useState('')
    return (
      <InputSettingComponent
        {...args}
        value={value}
        onChange={event => {
          setValue(event.target.value)
        }}
      />
    )
  },
}

export const AutoLogout: Story = {
  args: {
    label: 'Length of time for auto-logout due to inactivity',
    units: 'minutes',
  },
  render: args => {
    const [value, setValue] = useState('')
    return (
      <InputSettingComponent
        {...args}
        value={value}
        onChange={event => {
          setValue(event.target.value)
        }}
      />
    )
  },
}
