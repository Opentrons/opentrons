// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

import { RadialTimer } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof RadialTimer> = {
  title: 'ODD/Molecules/RadialTimer',
  component: RadialTimer,
  argTypes: {
    from: {
      control: { type: 'number' },
      description: 'Timestamp in ms when the timer started.',
    },
    until: {
      control: { type: 'number' },
      description: 'Timestamp in ms when the timer expires.',
    },
  },
  render: args => {
    const now = Date.now()
    const from = args.from ?? now
    const until = args.until ?? now + 30000
    return <RadialTimer from={from} until={until} />
  },
}

export default meta

type Story = StoryObj<typeof RadialTimer>

export const ThirtySeconds: Story = {
  args: {
    from: Date.now(),
    until: Date.now() + 30000,
  },
}

export const SixtySeconds: Story = {
  args: {
    from: Date.now(),
    until: Date.now() + 60000,
  },
}

export const TenSeconds: Story = {
  args: {
    from: Date.now(),
    until: Date.now() + 10000,
  },
}
