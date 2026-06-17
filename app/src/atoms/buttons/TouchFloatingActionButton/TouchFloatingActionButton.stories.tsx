import { ICON_DATA_BY_NAME, VIEWPORT } from '@opentrons/components'

import { TouchFloatingActionButton } from '.'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Atoms/Buttons/TouchFloatingActionButton',
  argTypes: {
    iconName: {
      control: {
        type: 'select',
        options: Object.keys(ICON_DATA_BY_NAME),
      },
      defaultValue: undefined,
    },
    onClick: { action: 'clicked' },
  },
  parameters: { ...VIEWPORT.touchScreenViewport },
} as Meta

const TouchFloatingActionButtonTemplate: Story<
  React.ComponentProps<typeof TouchFloatingActionButton>
> = args => <TouchFloatingActionButton {...args} />
export const TouchFloatingActionButtonComponent =
  TouchFloatingActionButtonTemplate.bind({})
TouchFloatingActionButtonComponent.args = {
  buttonText: 'Button text',
  disabled: false,
}
