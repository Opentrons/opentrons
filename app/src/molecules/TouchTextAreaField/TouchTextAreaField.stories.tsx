import * as React from 'react'

import { DIRECTION_COLUMN, SPACING, VIEWPORT } from '@opentrons/components'

import { TouchTextAreaField as TouchTextAreaFieldComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'

const meta: Meta<typeof TouchTextAreaFieldComponent> = {
  title: 'ODD/Molecules/TouchTextAreaField',
  component: TouchTextAreaFieldComponent,
  ...VIEWPORT.touchScreenViewport,
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof TouchTextAreaFieldComponent>

export const TextAreaField: Story = (
  args: ComponentProps<typeof TouchTextAreaFieldComponent>
) => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <TouchTextAreaFieldComponent
        {...args}
        value={value}
        onChange={e => {
          setValue(e.currentTarget.value)
        }}
      />
    </div>
  )
}

TextAreaField.args = {
  label: 'This is TouchTextAreaField',
  height: '22.5rem',
  placeholder: 'Placeholder Text',
}
