import * as React from 'react'

import { ModuleCalibrationConfirmModal } from './ModuleCalibrationConfirmModal'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Organisms/ModuleCalibrationConfirmModal',
  component: ModuleCalibrationConfirmModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof ModuleCalibrationConfirmModal>
> = args => <ModuleCalibrationConfirmModal {...args} />

export const Primary = Template.bind({})
Primary.args = {
  confirm: () => {},
  cancel: () => {},
}
