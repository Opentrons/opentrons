import { Toolbox as ToolboxComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ToolboxComponent> = {
  title: 'Library/Organisms/Toolbox',
  component: ToolboxComponent,
  decorators: [Story => <Story />],
}

export default meta
type Story = StoryObj<typeof ToolboxComponent>

export const Toolbox: Story = {
  args: {
    title: 'Header',
    children: <div>Slot Component: Replace me using the component panel.</div>,
    confirmButtonText: 'Done',
    onCloseClick: () => {},
    titleIconName: 'swap-horizontal',
    closeButtonText: 'Text link',
    onConfirmClick: () => {},
  },
}
