import * as React from 'react'
import { ToggleGroup as ToggleGroupComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ToggleGroupComponent> = {
  title: 'Library/Atoms/ToggleGroup',
  component: ToggleGroupComponent,
}

export default meta

type Story = StoryObj<typeof ToggleGroupComponent>
type ToggleGroupComponentProps = React.ComponentProps<
  typeof ToggleGroupComponent
>

const Template = (args: ToggleGroupComponentProps): JSX.Element => {
  const [value, setValue] = React.useState<'left' | 'right'>('left')

  return (
    <ToggleGroupComponent
      {...args}
      leftClick={() => {
        setValue('left')
      }}
      rightClick={() => {
        setValue('right')
      }}
      selectedValue={value === 'left' ? 'left button' : 'right button'}
    />
  )
}
export const ToggleGroup: Story = {
  render: Template,
  args: {
    leftText: 'left button',
    rightText: 'right button',
  },
}
