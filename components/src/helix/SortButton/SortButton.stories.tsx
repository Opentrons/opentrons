import * as React from 'react'

import { SortButton as SortButtonComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SortButtonComponent> = {
  title: 'Helix/Atoms/SortButton',
  component: SortButtonComponent,
  argTypes: {
    direction: {
      options: ['asc', 'desc'],
      control: {
        type: 'select',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SortButtonComponent>

const SortButtonTemplate = (
  args: React.ComponentProps<typeof SortButtonComponent>
): React.ReactNode => {
  const [active, setActive] = React.useState(args.active)
  const [direction, setDirection] = React.useState(args.direction)

  return (
    <SortButtonComponent
      {...args}
      active={active}
      direction={direction}
      onClick={() => {
        setActive(true)
        setDirection(direction === 'asc' ? 'desc' : 'asc')
      }}
    />
  )
}

export const SortButton: Story = {
  render: SortButtonTemplate,
  args: {
    label: 'Label',
    active: false,
    direction: 'asc',
  },
}

export const ActiveDescending: Story = {
  render: SortButtonTemplate,
  args: {
    label: 'Label',
    active: true,
    direction: 'desc',
  },
}
