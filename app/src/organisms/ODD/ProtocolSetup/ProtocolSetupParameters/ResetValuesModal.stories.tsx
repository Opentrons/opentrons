import { VIEWPORT } from '@opentrons/components'

import { ResetValuesModal } from './ResetValuesModal'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Organisms/ResetValuesModal',
  component: ResetValuesModal,
  ...VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof ResetValuesModal>> = args => (
  <ResetValuesModal {...args} />
)

export const ResetValues = Template.bind({})
ResetValues.args = {
  handleGoBack: () => {},
}
