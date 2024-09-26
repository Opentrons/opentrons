import { Box } from '../../primitives'
import { EmptySelectorButton as EmptySelectorButtonComponent } from './EmptySelectorButton'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof EmptySelectorButtonComponent> = {
  title: 'Library/Atoms/Buttons/EmptySelectorButton',
  component: EmptySelectorButtonComponent,
  argTypes: {
    size: {
      control: {
        type: 'select',
        options: ['large', 'small'],
      },
      defaultValue: 'large',
    },
    textAlignment: {
      controls: {
        type: 'select',
        options: ['left', 'middle'],
      },
      defaultValue: 'left',
    },
  },
  decorators: [
    (Story, context) => (
      <Box width="39.25rem" height="8.5rem">
        <Story id="content" />
      </Box>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof EmptySelectorButtonComponent>

export const EmptySelectorButton: Story = {
  args: {
    text: 'mock text',
    iconName: 'plus',
    size: 'small',
    textAlignment: 'left',
    onClick: () => {},
  },
}
