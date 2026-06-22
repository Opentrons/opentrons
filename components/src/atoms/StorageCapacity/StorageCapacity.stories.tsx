import { StorageCapacity as StorageCapacityComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StorageCapacityComponent> = {
  title: 'Helix/Atoms/Storage',
  component: StorageCapacityComponent,
}

export default meta

type StoryCapacity = StoryObj<typeof StorageCapacityComponent>

export const StorageCapacity: StoryCapacity = {
  args: {
    label: 'File capacity',
    percentUsed: 83,
  },
}
