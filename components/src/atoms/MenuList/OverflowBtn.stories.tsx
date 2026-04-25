import { OverflowBtn as OverflowBtnComponent } from './OverflowBtn'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof OverflowBtnComponent> = {
  title: 'Helix/Atoms/MenuList/OverflowBtn',
  component: OverflowBtnComponent,
}
export default meta

type Story = StoryObj<typeof OverflowBtnComponent>

export const OverflowBtn: Story = {
  args: {
    title: 'overflow btn with all the states',
  },
}
