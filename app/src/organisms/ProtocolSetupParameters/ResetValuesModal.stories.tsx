import * as React from 'react'

import { touchScreenViewport } from '../../DesignTokens/constants'
import { ResetValuesModal } from './ResetValuesModal'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/ResetValuesModal',
  component: ResetValuesModal,
  parameters: touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof ResetValuesModal>> = args => (
  <ResetValuesModal {...args} />
)

export const ResetValues = Template.bind({})
ResetValues.args = {
  handleGoBack: () => {},
}
