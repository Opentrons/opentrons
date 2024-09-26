import type * as React from 'react'
import { VIEWPORT } from '@opentrons/components'
import { ResetValuesModal } from './ResetValuesModal'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/ResetValuesModal',
  component: ResetValuesModal,
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof ResetValuesModal>> = args => (
  <ResetValuesModal {...args} />
)

export const ResetValues = Template.bind({})
ResetValues.args = {
  handleGoBack: () => {},
}
