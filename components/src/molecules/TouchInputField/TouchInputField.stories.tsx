import { useState } from 'react'

import { DIRECTION_COLUMN } from '../../styles'
import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { TouchInputField as TouchInputFieldComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'
import type { ChangeEvent, ComponentProps, ReactNode } from 'react'

const meta: Meta<typeof TouchInputFieldComponent> = {
  title: 'Helix/Molecules/TouchInputField',
  component: TouchInputFieldComponent,
  ...VIEWPORT.touchScreenViewport,
  argTypes: {
    units: {
      control: {
        type: 'boolean',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof TouchInputFieldComponent>

function TouchInputFieldStory(
  args: ComponentProps<typeof TouchInputFieldComponent>
): ReactNode {
  const [value, setValue] = useState(args.value)

  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <TouchInputFieldComponent
        autoFocus
        {...args}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.units ? 'rem' : undefined}
      />
    </div>
  )
}

function TouchInputFieldWithErrorStory(
  args: ComponentProps<typeof TouchInputFieldComponent>
): ReactNode {
  const [value, setValue] = useState(args.value)

  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <TouchInputFieldComponent
        autoFocus
        {...args}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </div>
  )
}

export const TouchInputField: Story = {
  render: args => <TouchInputFieldStory {...args} />,
  args: {
    value: 200,
    type: 'number',
    label: 'example label',
    caption: 'example caption',
    max: 200,
    min: 10,
  },
}

export const TouchInputFieldWithError: Story = {
  render: args => <TouchInputFieldWithErrorStory {...args} />,
  args: {
    value: 300,
    type: 'number',
    label: 'example label',
    max: 200,
    min: 10,
    error: 'input is not in the range',
  },
}
