import { DropdownMenu as DropdownMenuComponent } from './DropdownMenu'

import type { Meta, StoryObj } from '@storybook/react'
import type { DropdownOption } from './DropdownMenu'

function createMockOptions(): DropdownOption[] {
  const options: DropdownOption[] = []
  for (let i = 1; i <= 100; i++) {
    options.push({ name: `option ${i}`, value: `${i}` })
  }
  return options
}

const mockOptions: DropdownOption[] = createMockOptions()

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
