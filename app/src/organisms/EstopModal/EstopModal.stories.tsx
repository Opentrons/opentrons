import * as React from 'react'
import { DesktopEstopModal } from './DesktopEstopModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/organisms/DesktopEstopModal',
  component: DesktopEstopModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof DesktopEstopModal>
> = args => <DesktopEstopModal {...args} />

export const Primary = Template.bind({})
Primary.args = {
  isActiveRun: false,
  isEngaged: false,
}
