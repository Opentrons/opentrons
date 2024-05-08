import * as React from 'react'
import { Checkbox } from './index'

import type { StoryObj, Meta } from '@storybook/react'

const meta: Meta<typeof Checkbox> = {
  title: 'Library/Atoms/Checkbox',
  component: Checkbox,
}

type Story = StoryObj<typeof Checkbox>

export const Basic: Story = {
  args: {
    isChecked: true
  }
}

export default meta
