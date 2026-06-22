import * as React from 'react'

import { TextAreaField as TextAreaFieldComponent } from '.'
import { DIRECTION_COLUMN } from '../../styles'
import { SPACING, VIEWPORT } from '../../ui-style-constants'

import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'

const meta: Meta<typeof TextAreaFieldComponent> = {
  title: 'Helix/Molecules/TextAreaField',
  component: TextAreaFieldComponent,
  ...VIEWPORT.touchScreenViewport,
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof TextAreaFieldComponent>

export const TextAreaField: Story = (
  args: ComponentProps<typeof TextAreaFieldComponent>
) => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <TextAreaFieldComponent
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
  label: 'TextAreaField',
  height: '6.8125rem',
  placeholder: 'Placeholder Text',
}
