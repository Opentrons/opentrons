import { VIEWPORT } from '@opentrons/components'
import { MenuItem as MenuItemComponent } from './MenuItem'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof MenuItemComponent> = {
  title: 'App/Atoms/MenuItem',
  component: MenuItemComponent,
  parameters: VIEWPORT.touchScreenViewport,
}
export default meta

type Story = StoryObj<typeof MenuItemComponent>

export const MenuItem: Story = {
  args: {
    children: 'Example menu btn',
    disabled: false,
  },
}
