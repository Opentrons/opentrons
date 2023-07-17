import * as React from 'react'
import { DesktopEstopPressedModal } from './DesktopEstopPressedModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/organisms/DesktopEstopPressedModal',
  component: DesktopEstopPressedModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof DesktopEstopPressedModal>
> = args => <DesktopEstopPressedModal {...args} />

export const Primary = Template.bind({})
Primary.args = {
  isActiveRun: true,
  isEngaged: true,
}
