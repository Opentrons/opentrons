import { ProtocolCommand as ProtocolCommandComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ProtocolCommandComponent> = {
  title: 'App/Atoms/ProtocolCommand',
  component: ProtocolCommandComponent,
}

export default meta

type Story = StoryObj<typeof ProtocolCommandComponent>

export const ProtocolCommand: Story = {
  args: {},
}
