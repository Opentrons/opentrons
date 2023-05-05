import * as React from 'react'
import type { Story, Meta } from '@storybook/react'

import { RadioButton } from './'

export default {
  title: 'ODD/Atoms/Buttons/RadioButton',
  argTypes: {
    radioButtonType: {
      control: {
        type: 'select',
        options: ['large', 'small'],
      },
      defaultValue: 'large',
    },
    onClick: { action: 'clicked' },
  },
} as Meta

const RadioButtonTemplate: Story<
  React.ComponentProps<typeof RadioButton>
> = args => <RadioButton {...args} />

export const RadioButtonComponent = RadioButtonTemplate.bind({})
RadioButtonComponent.args = {
  buttonLabel: 'Button text',
  buttonValue: 1,
  disabled: false,
  isSelected: false,
}
