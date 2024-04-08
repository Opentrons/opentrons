import { COLORS, BORDERS } from '../helix-design-system'
import { SPACING } from '../ui-style-constants'
import { Box as BoxComponent } from './Box'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof BoxComponent> = {
  title: 'Library/Atoms/Box',
  component: BoxComponent,
}

export default meta

type Story = StoryObj<typeof BoxComponent>

export const Box: Story = {
  args: {
    children:
      'This is a simple box atom that accepts all primitive styling props.',
    backgroundColor: COLORS.grey60,
    border: `1px ${BORDERS.styleSolid} black`,
    padding: SPACING.spacing16,
    maxWidth: '20rem',
  },
}
