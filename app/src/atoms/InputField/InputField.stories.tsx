import * as React from 'react'
import { Flex, SPACING, VIEWPORT } from '@opentrons/components'
import { InputField as InputFieldComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InputFieldComponent> = {
  // ToDo (kk05/02/2024) this should be in Library but at this moment there is the same name component in components
  // The unification for this component will be done when the old component is retired completely.
  title: 'App/Atoms/InputField',
  component: InputFieldComponent,
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta
type Story = StoryObj<typeof InputFieldComponent>

export const InputField: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <Flex padding={SPACING.spacing16} width="100%">
      <InputFieldComponent
        {...args}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </Flex>
  )
}

InputField.args = {
  value: 200,
  units: 'rpm',
  type: 'number',
  caption: 'example caption',
  max: 200,
  min: 10,
}

export const InputFieldWithError: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <Flex padding={SPACING.spacing16} width="100%">
      <InputFieldComponent
        {...args}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </Flex>
  )
}

InputFieldWithError.args = {
  units: 'C',
  type: 'number',
  caption: 'example caption',
  max: 10,
  min: 10,
  error: 'input does not equal 10',
}
