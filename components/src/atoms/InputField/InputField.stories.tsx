import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { InputField as InputFieldComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InputFieldComponent> = {
  // ToDo (kk05/02/2024) this should be in Library but at this moment there is the same name component in components
  // The unification for this component will be done when the old component is retired completely.
  title: 'App/Atoms/InputField',
  component: InputFieldComponent,
  parameters: VIEWPORT.touchScreenViewport,
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
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <InputFieldComponent
        {...args}
        value={value}
        width="100%"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.units ? 'rem' : undefined}
      />
    </Flex>
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
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <InputFieldComponent
        {...args}
        value={value}
        width="100%"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </Flex>
  )
}

InputFieldWithError.args = {
  value: 300,
  type: 'number',
  max: 200,
  min: 10,
  error: 'input is not in the range',
}
