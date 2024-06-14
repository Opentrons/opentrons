import { VIEWPORT } from '@opentrons/components'
import { TabbedButton as TabbedButtonComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof TabbedButtonComponent> = {
  title: 'ODD/Atoms/Buttons/TabbedButton',
  component: TabbedButtonComponent,
  argTypes: { onClick: { action: 'clicked' } },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof TabbedButtonComponent>

export const TabbedButton: Story = {
  args: {
    isSelected: true,
    children: 'Button text',
    disabled: false,
    title: 'tabbed button',
  },
}
