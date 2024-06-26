import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  VIEWPORT,
} from '@opentrons/components'
import { ListItem as ListItemComponent } from '.'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ListItemComponent> = {
  title: 'ODD/Atoms/ListItem',
  component: ListItemComponent,
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['error', 'noActive', 'success', 'warning'],
      },
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof ListItemComponent>

export const ListItem: Story = {
  args: {
    type: 'noActive',
    children: (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <LegacyStyledText as="p">
          Slot Component: Replace me using the component panel.
        </LegacyStyledText>
        <LegacyStyledText as="p">
          Slot Component: Replace me using the component panel.
        </LegacyStyledText>
        <LegacyStyledText as="p">
          Slot Component: Replace me using the component panel.
        </LegacyStyledText>
      </Flex>
    ),
  },
}
