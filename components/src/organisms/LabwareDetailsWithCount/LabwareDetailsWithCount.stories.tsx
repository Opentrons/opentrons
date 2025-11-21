import React from 'react'
import { LabwareDetailsWithCount } from './LabwareDetailsWithCount'
import { SPACING } from '../../ui-style-constants'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof LabwareDetailsWithCount> = {
  title: 'Helix/Organisms/LabwareDetailsWithCount',
  component: LabwareDetailsWithCount,
  decorators: [
    Story => (
      <div style={{ padding: SPACING.spacing16, transform: 'scaleY(-1.0)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof LabwareDetailsWithCount>

export const LabwareDetailsWithCountStory: Story = {
  args: {
    title: 'Labware Title',
    subTitle: 'Labware Subtitle',
    quantity: 1,
  },
}
