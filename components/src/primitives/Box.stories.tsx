import { Box as BoxComponent } from './Box'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof BoxComponent> = {
  title: 'Library/Atoms/Box',
  component: BoxComponent,
}

export default meta

type Story = StoryObj<typeof BoxComponent>

export const Box: Story = {
  args: {
    children:
      'This is a simple box atom that accepts all primitive styling props.',
    backgroundColor: 'grey',
    border: '1px solid black',
    padding: '1rem',
    maxWidth: '20rem',
  },
}
