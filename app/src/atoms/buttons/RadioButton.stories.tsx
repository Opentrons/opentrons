import * as React from 'react'
import { customViewports } from '../../../../.storybook/preview'

import { RadioButton } from './'
import type { Story, Meta } from '@storybook/react'

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
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'onDeviceDisplay',
    },
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
