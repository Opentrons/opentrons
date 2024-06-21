import { action } from '@storybook/addon-actions'
import { VIEWPORT } from '@opentrons/components'

import { RadioButton as RadioButtonComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof RadioButtonComponent> = {
  title: 'ODD/Atoms/Buttons/RadioButton',
  component: RadioButtonComponent,
  argTypes: {
    radioButtonType: {
      control: {
        type: 'select',
        options: ['large', 'small'],
      },
      defaultValue: 'large',
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
  args: {
    onChange: action('on-change'),
  },
}
export default meta

type Story = StoryObj<typeof RadioButtonComponent>

export const RadioButton: Story = {
  args: {
    buttonLabel: 'Button text',
    buttonValue: 1,
    disabled: false,
    isSelected: false,
  },
}
