import * as React from 'react'
import { BORDERS } from '../../helix-design-system'
import { Box, Flex } from '../../primitives'
import { SPACING } from '../../ui-style-constants'

import { DeckLabelSet as DeckLabelSetComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const mockDeckLabels = [
  {
    text: 'Label',
    isSelected: false,
    labelBorderRadius: BORDERS.borderRadius4,
  },
  {
    text: 'Label',
    isSelected: false,
    labelBorderRadius: BORDERS.borderRadius4,
  },
]

const meta: Meta<typeof DeckLabelSetComponent> = {
  title: 'Library/Organisms/DeckLabelSet',
  component: DeckLabelSetComponent,
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof DeckLabelSetComponent>

export const DeckLabel: Story = {
  args: {
    // width and height from Figma
    children: <Box width="31.9375rem" height="5.75rem"></Box>,
    deckLabels: mockDeckLabels,
  },
}
