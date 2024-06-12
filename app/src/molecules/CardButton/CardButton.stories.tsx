import * as React from 'react'
import {
  Flex,
  ICON_DATA_BY_NAME,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { CardButton as CardButtonComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof CardButtonComponent> = {
  title: 'ODD/Molecules/CardButton',
  component: CardButtonComponent,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {
    iconName: {
      control: {
        type: 'select',
      },
      options: Object.keys(ICON_DATA_BY_NAME),
    },
  },
  decorators: [
    Story => (
      <Flex marginTop={SPACING.spacing16} width="15.375rem" height="17rem">
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof CardButtonComponent>

export const CardButton: Story = {
  args: {
    title: 'Header',
    iconName: 'wifi',
    description: 'Subtext.',
    destinationPath: '/app-molecules-cardbutton--primary',
    disabled: false,
  },
}
