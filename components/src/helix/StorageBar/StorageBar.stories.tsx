import { StorageBar as StorageBarComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StorageBarComponent> = {
  title: 'Helix/Atoms/StorageBar',
  component: StorageBarComponent,
}

export default meta

type StorageBarStory = StoryObj<typeof StorageBarComponent>

export const StorageBar: StorageBarStory = {
  args: {
    label: 'File capacity',
    percentUsed: 83,
  },
}
