import { Storage as StorageComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StorageComponent> = {
  title: 'Helix/Atoms/Storage',
  component: StorageComponent,
}

export default meta

type Story = StoryObj<typeof StorageComponent>

export const Storage: Story = {
  args: {
    label: 'File capacity',
    percentUsed: 83,
  },
}
