import { VIEWPORT } from '@opentrons/components'
import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'
import { ODDBackButton } from '.'

export default {
  title: 'ODD/Molecules/ODDBackButton',
  argTypes: {
    onClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const ODDBackButtonTemplate: Story<
  React.ComponentProps<typeof ODDBackButton>
> = args => <ODDBackButton {...args} />
export const ODDBackButtonComponent = ODDBackButtonTemplate.bind({})
ODDBackButtonComponent.args = {
  label: 'Previous location',
}
