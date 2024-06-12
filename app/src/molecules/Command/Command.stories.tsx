import { Command as CommandComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof CommandComponent> = {
  title: 'App/Molecules/Command/Command',
  component: CommandComponent,
}

export default meta

type Story = StoryObj<typeof CommandComponent>

export const Command: Story = {
  args: {},
}
