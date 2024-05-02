import { VIEWPORT } from '@opentrons/components'
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

export const InputField: Story = {
  args: {
    value: 200,
    units: 'rpm',
    type: 'number',
    caption: 'example caption',
    max: 200,
    min: 200,
  },
}

export const InputFieldWithError: Story = {
  args: {
    units: 'C',
    type: 'number',
    caption: 'example caption',
    max: 10,
    min: 10,
    error: 'input does not equal 10',
  },
}
