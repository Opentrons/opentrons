import * as React from 'react'
import { EstopMissingModal } from './EstopMissingModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/organisms/EstopMissingModal',
  component: EstopMissingModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof EstopMissingModal>
> = args => <EstopMissingModal {...args} />

export const EstopMissing = Template.bind({})
EstopMissing.args = {
  isActiveRun: true,
  robotName: 'Flexy',
}
