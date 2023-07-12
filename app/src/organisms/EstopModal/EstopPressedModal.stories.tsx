import * as React from 'react'
import { EstopPressedModal } from './EstopPressedModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/organisms/EstopPressedModal',
  component: EstopPressedModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof EstopPressedModal>
> = args => <EstopPressedModal {...args} />

export const EstopPressed = Template.bind({})
EstopPressed.args = {
  isActiveRun: true,
  isEngaged: true,
}
