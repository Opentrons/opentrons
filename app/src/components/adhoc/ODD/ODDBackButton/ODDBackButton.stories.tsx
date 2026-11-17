import { VIEWPORT } from '@opentrons/components'

import { ODDBackButton } from '.'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Molecules/ODDBackButton',
  argTypes: {
    onClick: { action: 'clicked' },
  },
  ...VIEWPORT.touchScreenViewport,
} as Meta

const ODDBackButtonTemplate: Story<
  React.ComponentProps<typeof ODDBackButton>
> = args => <ODDBackButton {...args} />
export const ODDBackButtonComponent = ODDBackButtonTemplate.bind({})
ODDBackButtonComponent.args = {
  label: 'Previous location',
}
