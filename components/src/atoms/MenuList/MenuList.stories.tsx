import { action } from '@storybook/addon-actions'
import type { Meta, StoryObj } from '@storybook/react'
import { MenuList as MenuListComponent } from './index'
import { MenuItem } from './MenuItem'

const menuBtn = 'example menu btn'

const meta: Meta<typeof MenuListComponent> = {
  title: 'Helix/Atoms/MenuList',
  component: MenuListComponent,
  args: {
    onClick: action('clicked'),
  },
}

export default meta

type Story = StoryObj<typeof MenuListComponent>

export const MenuList: Story = {
  args: {
    children: (
      <>
        <MenuItem>{menuBtn}</MenuItem>
        <MenuItem>{menuBtn}</MenuItem>
        <MenuItem>{menuBtn}</MenuItem>
      </>
    ),
  },
}
