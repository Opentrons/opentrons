/* eslint-disable storybook/prefer-pascal-case */
import { HELIX_STYLES, ODD_STYLES, StyledText } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StyledText> = {
  title: 'Helix/Atoms/StyledText',
  component: StyledText,
  argTypes: {
    oddStyle: {
      control: {
        type: 'select',
      },
      options: ODD_STYLES,
    },
    desktopStyle: {
      control: {
        type: 'select',
      },
      options: HELIX_STYLES,
    },
  },
  decorators: [
    Story => (
      <div style={{ padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof StyledText>

const dummyText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus sapien nunc dolor, aliquet nibh placerat et nisl, arcu. Pellentesque blandit sollicitudin vitae morbi morbi vulputate cursus tellus. Amet proin donec proin id aliquet in nullam.'

export const Example: Story = {
  args: {
    oddStyle: 'level1Header',
    desktopStyle: 'displayBold',
    children: dummyText,
  },
}
