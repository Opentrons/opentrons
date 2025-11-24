import React from 'react'

import { SPACING } from '../../ui-style-constants'
import { LabwareDetailsWithCount } from './LabwareDetailsWithCount'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof LabwareDetailsWithCount> = {
  title: 'Helix/Organisms/LabwareDetailsWithCount',
  component: LabwareDetailsWithCount,
  decorators: [
    Story => (
      <div>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof LabwareDetailsWithCount>

export const LabwareDetailsWithCountStory: Story = {
  args: {
    title: 'Opentrons Flex 96 Tip Rack 1000 µL',
    subTitle: 'With tip rack lid',
    quantity: 'Quantity: 1',
  },
}
