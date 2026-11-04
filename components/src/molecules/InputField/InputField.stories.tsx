import * as React from 'react'

import { customViewports } from '../../../../.storybook/preview'
import { DIRECTION_COLUMN } from '../../styles'
import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { InputField as InputFieldComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InputFieldComponent> = {
  // ToDo (kk05/02/2024) this should be in Library but at this moment there is the same name component in components
  // The unification for this component will be done when the old component is retired completely.
  title: 'Helix/Molecules/InputField',
  component: InputFieldComponent,
  viewport: {
    options: [VIEWPORT.touchScreenViewport, customViewports],
  },
  argTypes: {
    units: {
      control: {
        type: 'boolean',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof InputFieldComponent>

export const InputField: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <InputFieldComponent
        {...args}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.units ? 'rem' : undefined}
      />
    </div>
  )
}

InputField.args = {
  value: 200,
  type: 'number',
  caption: 'example caption',
  max: 200,
  min: 10,
}

export const InputFieldWithError: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <InputFieldComponent
        {...args}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </div>
  )
}

InputFieldWithError.args = {
  value: 300,
  type: 'number',
  max: 200,
  min: 10,
  error: 'input is not in the range',
}
