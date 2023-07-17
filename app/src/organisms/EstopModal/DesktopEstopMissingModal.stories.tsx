import * as React from 'react'
import { DesktopEstopMissingModal } from './DesktopEstopMissingModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/organisms/DesktopEstopMissingModal',
  component: DesktopEstopMissingModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof DesktopEstopMissingModal>
> = args => <DesktopEstopMissingModal {...args} />

export const Primary = Template.bind({})
Primary.args = {
  isActiveRun: true,
  robotName: 'Flexy',
}
