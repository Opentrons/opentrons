import { DropdownMenu as DropdownMenuComponent } from './DropdownMenu'

import type { Meta, StoryObj } from '@storybook/react'
import type { DropdownOption } from './DropdownMenu'

const mockOptions: DropdownOption[] = [
  { name: 'option 1', value: '1' },
  { name: 'option 2', value: '2' },
  { name: 'option 3', value: '3' },
  { name: 'option 4', value: '4' },
  { name: 'option 5', value: '5' },
  { name: 'option 6', value: '6' },
]

const meta: Meta<typeof DropdownMenuComponent> = {
  title: 'App/Atoms/DropdownMenu',
  component: DropdownMenuComponent,
}
export default meta

type Story = StoryObj<typeof DropdownMenuComponent>

export const DropdownMenu: Story = {
  args: {
    filterOptions: mockOptions,
    onClick: () => {},
    currentOption: mockOptions[0],
  },
}
