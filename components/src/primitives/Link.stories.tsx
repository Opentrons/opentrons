import { Link } from './Link'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Link> = {
  title: 'Library/Atoms/Link',
  component: Link,
}

export default meta

type Story = StoryObj<typeof Link>

export const Basic: Story = {
  args: {
    children: 'hello anchor',
    href: '#',
  },
}

export const External: Story = {
  args: {
    children: 'hello opentrons',
    external: true,
    href: 'https://www.opentrons.com',
  },
}
